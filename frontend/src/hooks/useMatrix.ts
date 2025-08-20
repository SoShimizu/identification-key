// frontend/src/hooks/useMatrix.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnsureMyKeysAndSamples, ListMyKeys, GetCurrentKeyName, PickKey } from "../../wailsjs/go/main/App";
import { getMatrix, applyFilters, Matrix, TaxonScore, Trait, TraitSuggestion, Choice } from "../api";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { useAlgoOpts } from "./useAlgoOpts";

// Small utility for debouncing
function useDebouncedCallback<T extends any[]>(fn: (...args: T) => void, delay: number) {
  const ref = useRef<number | undefined>(undefined);
  return useCallback((...args: T) => {
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = window.setTimeout(() => fn(...args), delay) as unknown as number;
  }, [fn, delay]);
}

export type KeyInfo = { name: string; path?: string };

export type TraitRow =
  | { group: string; traitName: string; type: "binary"; binary: Trait }
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[], parent?: string };

export function useMatrix() {
  // MyKeys
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);

  // Matrix
  const [matrixName, setMatrixName] = useState<string>("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [taxaCount, setTaxaCount] = useState<number>(0);

  // selection
  const [selected, setSelected] = useState<Record<string, Choice>>({});

  // mode/algo from UI settings
  const { opts, setOpts } = useAlgoOpts(matrixName);
  const [algo, setAlgo] = useState<"bayes" | "heuristic">("bayes");
  const mode = useMemo(() => opts.conflictPenalty > 0.5 ? "strict" : "lenient", [opts.conflictPenalty]);

  // results
  const [scores, setScores] = useState<TaxonScore[]>([]);
  const [suggs, setSuggs] = useState<TraitSuggestion[]>([]);

  // display settings
  const [suggAlgo, setSuggAlgo] = useState<"gini" | "entropy">("gini");
  const [sortBy, setSortBy] = useState<"recommend" | "group" | "name">("group");

  // history
  const [history, setHistory] = useState<{ t: number; text: string; gain?: number }[]>([]);

  // === MyKeys ===
  const refreshKeys = useCallback(async () => {
    await EnsureMyKeysAndSamples();
    const list = (await ListMyKeys()) as any as KeyInfo[];
    setKeys(list);
    const cur = await GetCurrentKeyName().catch(() => "");
    const found = list.find((k) => k.name === cur);
    setActiveKey(found ? found.name : list[0]?.name ?? undefined);
  }, []);

  const pickKey = useCallback(async (name: string) => {
    setActiveKey(name);
    await PickKey(name);
    setSelected({});
    setHistory([]);
  }, []);

  // === Matrix Loading ===
  const loadMatrix = useCallback(async () => {
    const m: Matrix = await getMatrix();
    setTraits(m.traits ?? []);
    setTaxaCount(m.taxa?.length ?? 0);
    setMatrixName(m.name ?? "");
  }, []);

  useEffect(() => {
    loadMatrix();
    refreshKeys();
    const unsubscribe = EventsOn("matrix_changed", loadMatrix);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadMatrix, refreshKeys]);

  // === Evaluation (debounced) ===
  const runEval = useCallback(async () => {
    const res = await applyFilters(selected, mode, algo, { ...opts, wantInfoGain: true });
    setScores(res.scores || []);
    setSuggs(res.suggestions || []);
  }, [selected, mode, algo, opts]);

  const runEvalDebounced = useDebouncedCallback(runEval, 120);
  useEffect(() => { runEvalDebounced(); }, [runEvalDebounced]);

  // === Selection Handlers ===
  const setBinary = useCallback((traitId: string, val: Choice, label?: string) => {
    setSelected((prev) => {
      const next = { ...prev, [traitId]: val };
      setHistory((h) => [{ t: Date.now(), text: `Set ${label || traitId} => ${val}` }, ...h].slice(0, 200));
      return next;
    });
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
      for (const cid of childrenIds) next[cid] = 0 as Choice;
      setHistory((h) => [{ t: Date.now(), text: `${asNA ? "Set NA" : "Clear"} ${parentLabel || "(derived)"}` }, ...h].slice(0, 200));
      return next;
    });
  }, []);

  // === Memoized derived state ===
  const suggMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of suggs || []) {
      const id = s.traitId;
      const sc = s.score ?? s.ig ?? 0;
      if (id) m[id] = Number(sc) || 0;
    }
    return m;
  }, [suggs]);

  const rowsUI = useMemo(() => {
    const byParent: Record<string, Trait[]> = {};
    const parents: Record<string, Trait> = {};
    const binaryTraits: Trait[] = [];

    for (const t of traits) {
        if (t.type === 'nominal_parent') {
            parents[t.name] = t;
        } else if (t.type === 'derived' && t.parent) {
            if (!byParent[t.parent]) byParent[t.parent] = [];
            byParent[t.parent].push(t);
        } else if (t.type === 'binary') {
            binaryTraits.push(t);
        }
    }

    const out: TraitRow[] = [];
    // Add nominal/ordinal parents first
    for (const parentName in byParent) {
        if (parents[parentName] && byParent[parentName]) {
            out.push({
                group: parents[parentName].group || "",
                traitName: parentName,
                type: "derived",
                parent: parents[parentName].parent,
                children: byParent[parentName].map(c => ({ id: c.id, label: c.state || c.name })),
            });
        }
    }

    // Add binary traits
    for (const t of binaryTraits) {
        out.push({ group: t.group || "", traitName: t.name, type: "binary", binary: { ...t } });
    }
    return out;
  }, [traits]);
  
  return {
    rows: rowsUI, traits, matrixName, taxaCount,
    selected, setBinary, setDerivedPick, clearDerived,
    mode, setMode, algo, setAlgo, opts, setOpts,
    scores, suggs, suggMap, sortBy, setSortBy, suggAlgo, setSuggAlgo,
    pickKey, keys, activeKey, refreshKeys,
    history,
  };
}