// frontend/src/hooks/useMatrix.ts
import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from "react";
import { EnsureMyKeysAndSamples, ListMyKeys, GetCurrentKeyName, PickKey } from "../../wailsjs/go/main/App";
import { applyFilters } from "../utils/applyFilters";
import { Matrix, TaxonScore, Trait, TraitSuggestion, Choice, MultiChoice, HistoryItem, MatrixInfo } from "../api";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { useAlgoOpts, AlgoOptions } from "./useAlgoOpts";
import { TraitRow } from "../components/panels/traits/TraitsPanel";

export type KeyInfo = { name: string; path?: string };

type HistoryState = {
  selected: Record<string, Choice>;
  selectedMulti: Record<string, MultiChoice>;
  log: HistoryItem;
};

type UseMatrixReturn = {
  matrixInfo: MatrixInfo | null;
  setMatrixInfo: Dispatch<SetStateAction<MatrixInfo | null>>; // ★ この行を追加
  rows: TraitRow[];
  traits: Trait[];
  matrixName: string;
  taxaCount: number;
  selected: Record<string, Choice>;
  selectedMulti: Record<string, MultiChoice>;
  setBinary: (traitId: string, val: Choice | null, label?: string) => void;
  setContinuous: (traitId: string, val: number | null, label?: string) => void;
  setMulti: (traitId: string, values: MultiChoice, label?: string) => void;
  setMultiAsNA: (traitId: string, label?: string) => void;
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
  history: HistoryItem[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lang: "ja" | "en";
  setLang: Dispatch<SetStateAction<"ja" | "en">>;
};

const getInitialLang = (): 'ja' | 'en' => {
  try {
    const storedLang = localStorage.getItem('user-lang');
    if (storedLang === 'ja' || storedLang === 'en') {
      return storedLang;
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ja')) {
      return 'ja';
    }
  } catch (e) {
    console.error("Failed to access language settings:", e);
  }
  return 'en'; // Default to English
};

export function useMatrix(): UseMatrixReturn {
  const [lang, setLang] = useState<"ja" | "en">(getInitialLang);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  
  const [matrixInfo, setMatrixInfo] = useState<MatrixInfo | null>(null);
  const [matrixName, setMatrixName] = useState<string>("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [taxaCount, setTaxaCount] = useState<number>(0);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const { opts, setOpts } = useAlgoOpts(matrixName);
  const [algo, setAlgo] = useState<"bayes" | "heuristic">("bayes");
  const mode = useMemo(() => (opts.conflictPenalty > 0.5 ? "strict" : "lenient"), [opts.conflictPenalty]);
  
  const [scores, setScores] = useState<TaxonScore[]>([]);
  const [suggs, setSuggs] = useState<TraitSuggestion[]>([]);
  const [suggAlgo, setSuggAlgo] = useState<"gini" | "entropy">("gini");
  const [sortBy, setSortBy] = useState<"recommend" | "group" | "name">("recommend");

  const currentState = history[historyIndex] ?? { selected: {}, selectedMulti: {}, log: { traitName: "Initial State", selection: "", timestamp: 0 } };
  const { selected, selectedMulti } = currentState;

  const currentHistoryLogs = history.slice(0, historyIndex + 1).map((h) => h.log).filter((log) => log.traitName !== "Initial State");

  useEffect(() => {
    try {
      localStorage.setItem('user-lang', lang);
    } catch (e) {
      console.error("Failed to save language setting:", e);
    }
  }, [lang]);

  const setMode = useCallback((newMode: "strict" | "lenient") => {
    setOpts((prev) => ({ ...prev, conflictPenalty: newMode === "strict" ? 1.0 : 0.0 }));
  }, [setOpts]);

  const refreshKeys = useCallback(async () => {
    try {
      await EnsureMyKeysAndSamples();
      const list = (await ListMyKeys()) as KeyInfo[];
      setKeys(list);
    } catch (error) {
      console.error("Failed to refresh keys:", error);
    }
  }, []);

  const pushHistory = useCallback((newSelected: Record<string, Choice>, newSelectedMulti: Record<string, MultiChoice>, log: HistoryItem) => {
    const newState: HistoryState = { selected: newSelected, selectedMulti: newSelectedMulti, log };
    setHistory((prev) => {
      const base = prev.slice(0, historyIndex + 1);
      const next = [...base, newState];
      setHistoryIndex(base.length);
      return next;
    });
  }, [historyIndex]);

  const pickKey = useCallback(async (name: string) => {
    try {
      setActiveKey(name);
      if(name) {
        await PickKey(name);
      } else {
        // If name is empty, clear the matrix state
        setMatrixInfo(null);
        setTraits([]);
        setTaxaCount(0);
        setMatrixName("");
        setHistory([{ selected: {}, selectedMulti: {}, log: { traitName: "Initial State", selection: "", timestamp: Date.now() } }]);
        setHistoryIndex(0);
        setScores([]);
        setSuggs([]);
      }
    } catch (error) {
      console.error(`Failed to pick key "${name}":`, error);
    }
  }, []);

  const lastEvaluatedState = useRef<string | null>(null);
  const loadMatrix = useCallback(async () => {
    try {
      const m: Matrix = await (window as any).go.main.App.GetMatrix();
      if (!m || !m.name) { // Handle case where no key is selected
        pickKey('');
        return;
      };
      setMatrixInfo(m.info ?? null);
      setTraits(m.traits ?? []);
      setTaxaCount(m.taxa?.length ?? 0);
      setMatrixName(m.name ?? "");
      setActiveKey((prev) => prev ?? m.name);
      
      setHistory([{ selected: {}, selectedMulti: {}, log: { traitName: "Initial State", selection: "", timestamp: Date.now() } }]);
      setHistoryIndex(0);
      setScores([]);
      setSuggs([]);
      lastEvaluatedState.current = null;
    } catch (err) {
      console.error("Failed to load matrix:", err);
      setMatrixInfo(null);
      setTraits([]);
      setTaxaCount(0);
      setMatrixName("Error loading matrix");
      lastEvaluatedState.current = null;
    }
  }, [pickKey]);

  useEffect(() => {
    const initialLoad = async () => {
        await refreshKeys();
        const cur = await GetCurrentKeyName().catch(() => "");
        setActiveKey(cur);
        await loadMatrix();
    };
    initialLoad();

    const unsubscribe = EventsOn("matrix_changed", loadMatrix);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadMatrix, refreshKeys]);

  const evalTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentStateKey = JSON.stringify({ selected, selectedMulti, mode, algo, opts: { conflictPenalty: opts.conflictPenalty, applyDependencies: opts.applyDependencies } });
    if (currentStateKey !== lastEvaluatedState.current) {
      if (evalTimerRef.current) window.clearTimeout(evalTimerRef.current);
      evalTimerRef.current = window.setTimeout(() => {
        applyFilters(selected, selectedMulti, mode, algo, { ...opts, wantInfoGain: true })
          .then((res) => {
            setScores(res.scores || []);
            setSuggs(res.suggestions || []);
            lastEvaluatedState.current = currentStateKey;
          })
          .catch((error) => console.error("Failed to run evaluation:", error));
      }, 150);
      return () => { if (evalTimerRef.current) window.clearTimeout(evalTimerRef.current); };
    }
  }, [selected, selectedMulti, mode, algo, opts]);

  const createLog = (traitName: string, selection: string): HistoryItem => ({ traitName, selection, timestamp: Date.now() });
  
  const setBinary = useCallback((traitId: string, val: Choice | null, label?: string) => {
      const next = { ...selected };
      if (val === null) delete next[traitId]; else next[traitId] = val;
      const valText = val === null ? "Cleared" : val === 0 ? "NA" : val === 1 ? "Yes" : "No";
      pushHistory(next, selectedMulti, createLog(label || traitId, valText));
  }, [selected, selectedMulti, pushHistory]);

  const setContinuous = useCallback((traitId: string, val: number | null, label?: string) => {
      const next = { ...selected };
      if (val === null) delete next[traitId]; else next[traitId] = val;
      pushHistory(next, selectedMulti, createLog(label || traitId, val === null ? "Cleared" : `${val}`));
  }, [selected, selectedMulti, pushHistory]);

  const setMulti = useCallback((traitId: string, values: MultiChoice, label?: string) => {
      const nextSel = { ...selected };
      delete nextSel[traitId];
      const nextMulti = { ...selectedMulti };
      if (values.length === 0) delete nextMulti[traitId]; else nextMulti[traitId] = values;
      pushHistory(nextSel, nextMulti, createLog(label || traitId, `[${values.join(", ")}]`));
  }, [selected, selectedMulti, pushHistory]);
  
  const setMultiAsNA = useCallback((traitId: string, label?: string) => {
    const nextMulti = { ...selectedMulti };
    delete nextMulti[traitId];
    const nextSel = { ...selected, [traitId]: 0 };
    pushHistory(nextSel, nextMulti, createLog(label || traitId, "NA"));
  },[selected, selectedMulti, pushHistory]);

  const setDerivedPick = useCallback((childrenIds: string[], chosenId: string, parentLabel?: string) => {
      const next = { ...selected };
      for (const cid of childrenIds) next[cid] = cid === chosenId ? 1 : -1;
      const chosenTrait = traits.find((t) => t.id === chosenId);
      const label = lang === 'ja' ? chosenTrait?.name_jp || chosenTrait?.name_en : chosenTrait?.name_en || chosenTrait?.name_jp;
      pushHistory(next, selectedMulti, createLog(parentLabel || "(derived)", chosenTrait?.state || label || chosenId));
  }, [selected, selectedMulti, traits, pushHistory, lang]);

  const clearDerived = useCallback((childrenIds: string[], parentLabel?: string, asNA?: boolean) => {
      const next = { ...selected };
      for (const cid of childrenIds) {
        if (asNA) next[cid] = 0;
        else delete next[cid];
      }
      pushHistory(next, selectedMulti, createLog(parentLabel || "(derived)", asNA ? "NA" : "Cleared"));
  }, [selected, selectedMulti, pushHistory]);

  const clearAllSelections = useCallback(() => {
    pushHistory({}, {}, createLog("All Selections", "Cleared"));
  }, [pushHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const undo = () => { if (canUndo) setHistoryIndex(historyIndex - 1); };
  const redo = () => { if (canRedo) setHistoryIndex(historyIndex + 1); };

  const suggMap: Record<string, TraitSuggestion> = useMemo(() => {
    const m: Record<string, TraitSuggestion> = {};
    for (const s of suggs || []) { if (s.traitId) m[s.traitId] = s; }
    return m;
  }, [suggs]);

  const rows: TraitRow[] = useMemo(() => {
    const byParent: Record<string, Trait[]> = {};
    const parents: Record<string, Trait> = {};
    const otherTraits: Trait[] = [];

    for (const t of traits) {
      if (t.type === "nominal_parent") parents[t.traitId || ''] = t;
      else if (t.type === "derived" && t.parent) {
        if (!byParent[t.parent]) byParent[t.parent] = [];
        byParent[t.parent].push(t);
      } else otherTraits.push(t);
    }
    const out: TraitRow[] = [];
    for (const parentId in byParent) {
      const parentTrait = parents[parentId];
      if (parentTrait && byParent[parentId]) {
        out.push({
          group: (lang === 'ja' ? parentTrait.group_jp || parentTrait.group_en : parentTrait.group_en || parentTrait.group_jp) || "",
          traitName: (lang === 'ja' ? parentTrait.name_jp || parentTrait.name_en : parentTrait.name_en || parentTrait.name_jp) || "",
          type: "derived",
          parentTrait: parentTrait,
          children: byParent[parentId].map((c) => ({ id: c.id, label: c.state || (lang === 'ja' ? c.name_jp || c.name_en : c.name_en || c.name_jp) })),
        });
      }
    }
    for (const t of otherTraits) {
      const group = (lang === 'ja' ? t.group_jp || t.group_en : t.group_en || t.group_jp) || "";
      const traitName = (lang === 'ja' ? t.name_jp || t.name_en : t.name_en || t.name_jp) || "";
      if (t.type === "binary") out.push({ group, traitName, type: "binary", binary: { ...t } });
      else if (t.type === "continuous") out.push({ group, traitName, type: "continuous", continuous: { ...t } });
      else if (t.type === "categorical_multi") out.push({ group, traitName, type: "categorical_multi", multi: { ...t } });
    }
    return out;
  }, [traits, lang]);

  return useMemo(() => ({
    matrixInfo, setMatrixInfo,
    rows, traits, matrixName, taxaCount,
    selected, selectedMulti,
    setBinary, setContinuous, setMulti, setMultiAsNA,
    setDerivedPick, clearDerived, clearAllSelections,
    mode, setMode,
    algo, setAlgo,
    opts, setOpts,
    scores, suggs, suggMap,
    sortBy, setSortBy,
    suggAlgo, setSuggAlgo,
    pickKey, keys, activeKey, refreshKeys,
    history: currentHistoryLogs,
    undo, redo, canUndo, canRedo,
    lang, setLang,
  }), [
    matrixInfo, rows, traits, matrixName, taxaCount,
    selected, selectedMulti,
    setBinary, setContinuous, setMulti, setMultiAsNA,
    setDerivedPick, clearDerived, clearAllSelections,
    mode, setMode,
    algo, setAlgo,
    opts, setOpts,
    scores, suggs, suggMap,
    sortBy, setSortBy,
    suggAlgo, setSuggAlgo,
    pickKey, keys, activeKey, refreshKeys,
    currentHistoryLogs,
    undo, redo, canUndo, canRedo,
    lang, setLang,
  ]);
}