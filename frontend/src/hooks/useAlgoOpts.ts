// frontend/src/hooks/useAlgoOpts.ts
import { useEffect, useState } from "react";
import { main } from "../../wailsjs/go/models";

export type AlgoOptions = main.ApplyOptions & {
  gammaNAPenalty: number;
  epsilonCut:     number;
  conflictPenalty: number;
  usePragmaticScore: boolean; // ✨ 追加
};

export const DEFAULT_OPTS: AlgoOptions = {
  defaultAlphaFP: 0.03,
  defaultBetaFN:  0.07,
  gammaNAPenalty: 0.95,
  kappa:          1.0,
  epsilonCut:     1e-6,
  conflictPenalty: 1.0,
  usePragmaticScore: true, // ✨ デフォルトは有効
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
      if (raw) return { ...DEFAULT_OPTS, ...JSON.parse(raw) };
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
    gammaNAPenalty: clamp(o.gammaNAPenalty, 0.8, 1.0),
    kappa:          clamp(o.kappa,          0, 5),
    epsilonCut:     clamp(o.epsilonCut,     1e-12, 1e-3),
    conflictPenalty: clamp(o.conflictPenalty, 0, 1),
  };
}