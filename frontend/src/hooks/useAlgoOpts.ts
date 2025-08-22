// frontend/src/hooks/useAlgoOpts.ts
import { useEffect, useState } from "react";
import { main } from "../../wailsjs/go/models";

// Define a version for the settings object. Increment this when defaults are changed.
const SETTINGS_VERSION = 5; // Increment version for the new strategy default

export type AlgoOptions = main.ApplyOptions & {
  settingsVersion?: number;
  gammaNAPenalty: number;
  epsilonCut:     number;
  conflictPenalty: number;
  usePragmaticScore: boolean;
  recommendationStrategy: "expected_ig" | "max_ig";
  toleranceFactor: number;
  categoricalAlgo: "jaccard" | "binary";
  jaccardThreshold: number;
};

export const DEFAULT_OPTS: AlgoOptions = {
  settingsVersion: SETTINGS_VERSION,
  defaultAlphaFP: 0.03,
  defaultBetaFN:  0.07,
  gammaNAPenalty: 0.8,
  kappa:          1.0,
  epsilonCut:     1e-6,
  conflictPenalty: 0.5,
  usePragmaticScore: true,
  recommendationStrategy: "max_ig", // CHANGE DEFAULT: Default to breakthrough mode for experts
  toleranceFactor: 0.1,
  categoricalAlgo: "binary", 
  jaccardThreshold: 0.01, 
  wantInfoGain: false,
  lambda: 1.0,
  a0: 1.0,
  b0: 1.0,
  alphaFP: {},
  betaFN: {},
  confidence: {},
  priors: {},
};

const KEY = (matrixName: string) => `algoOpts::${matrixName || "default"}`;

export function useAlgoOpts(matrixName: string) {
  const [opts, setOpts] = useState<AlgoOptions>(() => {
    try {
      const raw = localStorage.getItem(KEY(matrixName));
      if (raw) {
        const parsed = JSON.parse(raw);

        if (!parsed.settingsVersion || parsed.settingsVersion < SETTINGS_VERSION) {
          console.log("Old settings detected. Migrating to new defaults.");
          const migratedOpts = {
            ...DEFAULT_OPTS, 
            ...parsed,       
            settingsVersion: SETTINGS_VERSION,
            recommendationStrategy: DEFAULT_OPTS.recommendationStrategy, 
          };
          return migratedOpts;
        }
        return { ...DEFAULT_OPTS, ...parsed };
      }
    } catch {}
    return DEFAULT_OPTS;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY(matrixName), JSON.stringify(opts)); } catch {}
  }, [matrixName, opts]);

  const reset = () => setOpts(DEFAULT_OPTS);
  return { opts, setOpts, reset };
}

export function clampAlgoOptions(o: AlgoOptions): AlgoOptions {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return {
    ...o,
    defaultAlphaFP: clamp(o.defaultAlphaFP, 0, 0.2),
    defaultBetaFN:  clamp(o.defaultBetaFN,  0, 0.2),
    gammaNAPenalty: clamp(o.gammaNAPenalty, 0.0, 1.0),
    kappa:          clamp(o.kappa,          0, 5),
    epsilonCut:     clamp(o.epsilonCut,     1e-12, 1e-3),
    conflictPenalty: clamp(o.conflictPenalty, 0, 1),
    toleranceFactor: clamp(o.toleranceFactor, 0, 0.5),
    jaccardThreshold: clamp(o.jaccardThreshold, 0, 1),
  };
}