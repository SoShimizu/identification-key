// frontend/src/hooks/useMatrix.ts
import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from "react";
import { EnsureMyKeysAndSamples, ListMyKeys, GetCurrentKeyName, PickKey } from "../../wailsjs/go/main/App";
import { applyFilters } from "../utils/applyFilters";
import { Matrix, TaxonScore, Trait, TraitSuggestion, Choice, MultiChoice } from "../api";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { useAlgoOpts, AlgoOptions } from "./useAlgoOpts";
import { TraitRow } from "../components/panels/traits/TraitsPanel";

function useDebouncedCallback<T extends any[]>(fn: (...args: T) => void, delay: number) {
  const ref = useRef<number | undefined>(undefined);
  return useCallback((...args: T) => {
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = window.setTimeout(() => fn(...args), delay) as unknown as number;
  }, [fn, delay]);
}

export type KeyInfo = { name: string; path?: string };

type UseMatrixReturn = {
    rows: TraitRow[];
    traits: Trait[];
    matrixName: string;
    taxaCount: number;
    selected: Record<string, Choice>;
    selectedMulti: Record<string, MultiChoice>; 
    setBinary: (traitId: string, val: Choice | null, label?: string) => void;
    setContinuous: (traitId: string, val: number | null, label?: string) => void;
    setMulti: (traitId: string, values: MultiChoice, label?: string) => void; 
    setMultiAsNA: (traitId: string, label?: string) => void; // New handler for NA
    setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel?: string) => void;
    clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
    clearAllSelections: () => void;
    mode: "strict" | "lenient";
    setMode: (newMode: "strict" | "lenient") => void;
    algo: "bayes" | "heuristic";
    setAlgo: Dispatch<SetStateAction<"bayes" | "heuristic">>;
    opts: AlgoOptions;
    setOpts: Dispatch<SetStateAction<AlgoOptions>>;
    scores: TaxonScore[];
    suggs: TraitSuggestion[];
    suggMap: Record<string, TraitSuggestion>;
    sortBy: "recommend" | "group" | "name";
    setSortBy: Dispatch<SetStateAction<"recommend" | "group" | "name">>;
    suggAlgo: "gini" | "entropy";
    setSuggAlgo: Dispatch<SetStateAction<"gini" | "entropy">>;
    pickKey: (name: string) => Promise<void>;
    keys: KeyInfo[];
    activeKey: string | undefined;
    refreshKeys: () => Promise<void>;
    history: { t: number; text: string; gain?: number }[];
};


export function useMatrix(): UseMatrixReturn {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [matrixName, setMatrixName] = useState<string>("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [taxaCount, setTaxaCount] = useState<number>(0);
  const [selected, setSelected] = useState<Record<string, Choice>>({});
  const [selectedMulti, setSelectedMulti] = useState<Record<string, MultiChoice>>({});
  const { opts, setOpts } = useAlgoOpts(matrixName);
  const [algo, setAlgo] = useState<"bayes" | "heuristic">("bayes");
  const mode = useMemo(() => (opts.conflictPenalty > 0.5 ? "strict" : "lenient"), [opts.conflictPenalty]);
  const [scores, setScores] = useState<TaxonScore[]>([]);
  const [suggs, setSuggs] = useState<TraitSuggestion[]>([]);
  const [suggAlgo, setSuggAlgo] = useState<"gini" | "entropy">("gini");
  const [sortBy, setSortBy] = useState<"recommend" | "group" | "name">("recommend");
  const [history, setHistory] = useState<{ t: number; text: string; gain?: number }[]>([]);

  const setMode = useCallback((newMode: "strict" | "lenient") => {
      setOpts(prevOpts => ({ ...prevOpts, conflictPenalty: newMode === 'strict' ? 1.0 : 0.0 }));
  }, [setOpts]);

  const refreshKeys = useCallback(async () => {
    try {
        await EnsureMyKeysAndSamples();
        const list = (await ListMyKeys()) as any as KeyInfo[];
        setKeys(list);
        const cur = await GetCurrentKeyName().catch(() => "");
        const found = list.find((k) => k.name === cur);
        setActiveKey(found ? found.name : list[0]?.name ?? undefined);
    } catch (error) { console.error("Failed to refresh keys:", error); }
  }, []);

  const pickKey = useCallback(async (name: string) => {
    try {
        setActiveKey(name);
        await PickKey(name);
        setSelected({});
        setSelectedMulti({});
        setHistory([]);
    } catch (error) { console.error(`Failed to pick key "${name}":`, error); }
  }, []);

  const loadMatrix = useCallback(async () => {
    try {
      const m: Matrix = await (window as any).go.main.App.GetMatrix();
      setTraits(m.traits ?? []);
      setTaxaCount(m.taxa?.length ?? 0);
      setMatrixName(m.name ?? "");
    } catch(err) {
      console.error("Failed to load matrix:", err);
      setTraits([]);
      setTaxaCount(0);
      setMatrixName("Error loading matrix");
    }
  }, []);

  useEffect(() => {
    loadMatrix();
    refreshKeys();
    const unsubscribe = EventsOn("matrix_changed", loadMatrix);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadMatrix, refreshKeys]);

  const runEval = useCallback(async () => {
    try {
        const res = await applyFilters(selected, selectedMulti, mode, algo, { ...opts, wantInfoGain: true });
        setScores(res.scores || []);
        setSuggs(res.suggestions || []);
    } catch (error) { console.error("Failed to run evaluation:", error); }
  }, [selected, selectedMulti, mode, algo, opts]);

  const runEvalDebounced = useDebouncedCallback(runEval, 120);
  useEffect(() => { runEvalDebounced(); }, [runEvalDebounced]);

  const setBinary = useCallback((traitId: string, val: Choice | null, label?: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (val === null) {
          delete next[traitId];
          setHistory((h) => [{ t: Date.now(), text: `Clear ${label || traitId}` }, ...h].slice(0, 200));
      } else {
          next[traitId] = val;
          const valText = val === 0 ? "NA" : val === 1 ? "Yes" : "No";
          setHistory((h) => [{ t: Date.now(), text: `Set ${label || traitId} => ${valText}` }, ...h].slice(0, 200));
      }
      return next;
    });
  }, []);

  const setContinuous = useCallback((traitId: string, val: number | null, label?: string) => {
    setSelected((prev) => {
        const next = { ...prev };
        if (val === null) {
            delete next[traitId];
            setHistory((h) => [{ t: Date.now(), text: `Clear ${label || traitId}` }, ...h].slice(0, 200));
        } else {
            next[traitId] = val;
            setHistory((h) => [{ t: Date.now(), text: `Set ${label || traitId} => ${val}` }, ...h].slice(0, 200));
        }
        return next;
    });
  }, []);

  const setMulti = useCallback((traitId: string, values: MultiChoice, label?: string) => {
    setSelected(prev => {
        const next = {...prev};
        delete next[traitId]; // Clear any NA state for this trait
        return next;
    });
    setSelectedMulti(prev => {
        const next = {...prev};
        if(values.length === 0) {
            delete next[traitId];
            setHistory((h) => [{ t: Date.now(), text: `Clear ${label || traitId}` }, ...h].slice(0, 200));
        } else {
            next[traitId] = values;
            setHistory((h) => [{ t: Date.now(), text: `Set ${label || traitId} => [${values.join(', ')}]` }, ...h].slice(0, 200));
        }
        return next;
    });
  }, []);
  
  const setMultiAsNA = useCallback((traitId: string, label?: string) => {
      setSelectedMulti(prev => {
          const next = {...prev};
          delete next[traitId]; // Clear any selected states
          return next;
      });
      setSelected(prev => {
          const next = {...prev};
          next[traitId] = 0; // Set NA state
          return next;
      });
      setHistory((h) => [{ t: Date.now(), text: `Set ${label || traitId} => NA` }, ...h].slice(0, 200));
  }, []);

  const setDerivedPick = useCallback((childrenIds: string[], chosenId: string, parentLabel?: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const cid of childrenIds) next[cid] = (cid === chosenId ? 1 : -1) as Choice;
      setHistory((h) => [{ t: Date.now(), text: `Pick ${parentLabel || "(derived)"} => ${chosenId}` }, ...h].slice(0, 200));
      return next;
    });
  }, []);

  const clearDerived = useCallback((childrenIds: string[], parentLabel?: string, asNA?: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const cid of childrenIds) {
          if (asNA) {
              next[cid] = 0;
          } else {
              delete next[cid];
          }
      }
      setHistory((h) => [{ t: Date.now(), text: `${asNA ? "Set NA" : "Clear"} ${parentLabel || "(derived)"}` }, ...h].slice(0, 200));
      return next;
    });
  }, []);

  const clearAllSelections = useCallback(() => {
    setSelected({});
    setSelectedMulti({});
    setHistory([]);
  }, []);

  const suggMap: Record<string, TraitSuggestion> = useMemo(() => {
    const m: Record<string, TraitSuggestion> = {};
    for (const s of suggs || []) {
      if (s.traitId) m[s.traitId] = s;
    }
    return m;
  }, [suggs]);

    const rows: TraitRow[] = useMemo(() => {
        const byParent: Record<string, Trait[]> = {};
        const parents: Record<string, Trait> = {};
        const otherTraits: Trait[] = [];

        for (const t of traits) {
            if (t.type === 'nominal_parent') parents[t.name] = t;
            else if (t.type === 'derived' && t.parent) {
                if (!byParent[t.parent]) byParent[t.parent] = [];
                byParent[t.parent].push(t);
            } else otherTraits.push(t);
        }

        const out: TraitRow[] = [];
        for (const parentName in byParent) {
            const parentTrait = parents[parentName];
            if (parentTrait && byParent[parentName]) {
                out.push({
                    group: parentTrait.group || "",
                    traitName: parentName,
                    type: "derived",
                    parentTrait: parentTrait,
                    children: byParent[parentName].map(c => ({ id: c.id, label: c.state || c.name })),
                });
            }
        }

        for (const t of otherTraits) {
            if (t.type === 'binary') out.push({ group: t.group || "", traitName: t.name, type: "binary", binary: { ...t } });
            else if (t.type === 'continuous') out.push({ group: t.group || "", traitName: t.name, type: "continuous", continuous: { ...t } });
            else if (t.type === 'categorical_multi') out.push({ group: t.group || "", traitName: t.name, type: "categorical_multi", multi: { ...t } });
        }
        return out;
    }, [traits]);

  return {
    rows, traits, matrixName, taxaCount,
    selected, selectedMulti, setBinary, setContinuous, setMulti, setMultiAsNA, setDerivedPick, clearDerived, clearAllSelections,
    mode, setMode, algo, setAlgo, opts, setOpts,
    scores, suggs, suggMap, sortBy, setSortBy, suggAlgo, setSuggAlgo,
    pickKey, keys, activeKey, refreshKeys,
    history,
  };
}