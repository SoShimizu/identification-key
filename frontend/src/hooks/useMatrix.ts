// frontend/src/hooks/useMatrix.ts
import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from "react";
import { EnsureMyKeysAndSamples, ListMyKeys, GetCurrentKeyName, PickKey } from "../../wailsjs/go/main/App";
import { applyFilters } from "../utils/applyFilters";
import { Matrix, TaxonScore, Trait, TraitSuggestion, Choice, MultiChoice, HistoryItem } from "../api";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { useAlgoOpts, AlgoOptions } from "./useAlgoOpts";
import { TraitRow } from "../components/panels/traits/TraitsPanel";

export type KeyInfo = { name: string; path?: string };

// History（Undo/Redo）の内部形
type HistoryState = {
  selected: Record<string, Choice>;
  selectedMulti: Record<string, MultiChoice>;
  log: HistoryItem;
};

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
};

export function useMatrix(): UseMatrixReturn {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [matrixName, setMatrixName] = useState<string>("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [taxaCount, setTaxaCount] = useState<number>(0);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const { opts, setOpts } = useAlgoOpts(matrixName);
  const [algo, setAlgo] = useState<"bayes" | "heuristic">("bayes");
  const mode = useMemo(
    () => (opts.conflictPenalty > 0.5 ? "strict" : "lenient"),
    [opts.conflictPenalty]
  );
  const [scores, setScores] = useState<TaxonScore[]>([]);
  const [suggs, setSuggs] = useState<TraitSuggestion[]>([]);
  const [suggAlgo, setSuggAlgo] = useState<"gini" | "entropy">("gini");
  const [sortBy, setSortBy] = useState<"recommend" | "group" | "name">("recommend");

  // 現在の選択状態（historyから導出）
  const currentState =
    history[historyIndex] ??
    { selected: {}, selectedMulti: {}, log: { traitName: "Initial State", selection: "", timestamp: 0 } };
  const { selected, selectedMulti } = currentState;

  // UI表示用の履歴（初期ログは除外）
  const currentHistoryLogs = history
    .slice(0, historyIndex + 1)
    .map((h) => h.log)
    .filter((log) => log.traitName !== "Initial State");

  const setMode = useCallback(
    (newMode: "strict" | "lenient") => {
      setOpts((prev) => ({ ...prev, conflictPenalty: newMode === "strict" ? 1.0 : 0.0 }));
    },
    [setOpts]
  );

  const refreshKeys = useCallback(async () => {
    try {
      await EnsureMyKeysAndSamples();
      const list = (await ListMyKeys()) as any as KeyInfo[];
      setKeys(list);
      const cur = await GetCurrentKeyName().catch(() => "");
      const found = list.find((k) => k.name === cur);
      setActiveKey(found ? found.name : list[0]?.name ?? undefined);
    } catch (error) {
      console.error("Failed to refresh keys:", error);
    }
  }, []);

  // ヒストリーに状態を積む（Undo/Redo対応）
  const pushHistory = useCallback(
    (newSelected: Record<string, Choice>, newSelectedMulti: Record<string, MultiChoice>, log: HistoryItem) => {
      const newState: HistoryState = { selected: newSelected, selectedMulti: newSelectedMulti, log };
      setHistory((prev) => {
        const base = prev.slice(0, historyIndex + 1);
        const next = [...base, newState];
        // index更新は prev に依存しない安全な現在値から計算
        setHistoryIndex(base.length);
        return next;
      });
    },
    [historyIndex]
  );

  const pickKey = useCallback(async (name: string) => {
    try {
      // UI的に即時反映
      setActiveKey(name);
      await PickKey(name);
      // 実体の切替は "matrix_changed" イベントで処理
    } catch (error) {
      console.error(`Failed to pick key "${name}":`, error);
    }
  }, []);

  // マトリクス読込。読込のたびに「次の評価を必ず一回走らせる」ため ref をリセット
  const lastEvaluatedState = useRef<string | null>(null);
  const loadMatrix = useCallback(async () => {
    try {
      const m: Matrix = await (window as any).go.main.App.GetMatrix();
      setTraits(m.traits ?? []);
      setTaxaCount(m.taxa?.length ?? 0);
      setMatrixName(m.name ?? "");
      setActiveKey((prev) => prev ?? m.name);

      // 新しいマトリクスに合わせてユーザ状態をリセット
      setHistory([]);
      setHistoryIndex(-1);
      setScores([]);
      setSuggs([]);

      // ★ここが肝：次のレンダーで必ず評価が走る
      lastEvaluatedState.current = null;
    } catch (err) {
      console.error("Failed to load matrix:", err);
      setTraits([]);
      setTaxaCount(0);
      setMatrixName("Error loading matrix");
      // 失敗時も一度は評価を走らせ、UIを空に同期
      lastEvaluatedState.current = null;
    }
  }, []);

  // 初期ロード & イベント購読
  useEffect(() => {
    loadMatrix();
    refreshKeys();
    const unsubscribe = EventsOn("matrix_changed", () => {
      // バックエンドからマトリクス変更通知
      loadMatrix();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadMatrix, refreshKeys]);

  // デバウンス用のタイマー
  const evalTimerRef = useRef<number | undefined>(undefined);

  // 評価（applyFilters）を安全にデバウンス実行
  useEffect(() => {
    const currentStateKey = JSON.stringify({
      selected,
      selectedMulti,
      mode,
      algo,
      // opts は必要なキーだけ拾うと安定します（順序ブレ対策）
      opts: {
        conflictPenalty: opts.conflictPenalty,
        applyDependencies: opts.applyDependencies,
        // 他にも評価に効く箇所があれば同様に列挙
      },
    });

    if (currentStateKey !== lastEvaluatedState.current) {
      if (evalTimerRef.current) {
        window.clearTimeout(evalTimerRef.current);
      }
      evalTimerRef.current = window.setTimeout(() => {
        applyFilters(selected, selectedMulti, mode, algo, { ...opts, wantInfoGain: true })
          .then((res) => {
            setScores(res.scores || []);
            setSuggs(res.suggestions || []);
            // このキーの評価が完了したので記録
            lastEvaluatedState.current = currentStateKey;
          })
          .catch((error) => {
            console.error("Failed to run evaluation:", error);
            // 失敗した場合は再試行できるように current を進めない
          });
      }, 150) as unknown as number;

      // クリーンアップ
      return () => {
        if (evalTimerRef.current) {
          window.clearTimeout(evalTimerRef.current);
        }
      };
    }
  }, [selected, selectedMulti, mode, algo, opts]);

  const createLog = (traitName: string, selection: string): HistoryItem => ({
    traitName,
    selection,
    timestamp: Date.now(),
  });

  const setBinary = useCallback(
    (traitId: string, val: Choice | null, label?: string) => {
      const next = { ...selected };
      if (val === null) delete next[traitId];
      else next[traitId] = val;
      const valText = val === null ? "Cleared" : val === 0 ? "NA" : val === 1 ? "Yes" : "No";
      pushHistory(next, selectedMulti, createLog(label || traitId, valText));
    },
    [selected, selectedMulti, pushHistory]
  );

  const setContinuous = useCallback(
    (traitId: string, val: number | null, label?: string) => {
      const next = { ...selected };
      if (val === null) delete next[traitId];
      else next[traitId] = val;
      pushHistory(next, selectedMulti, createLog(label || traitId, val === null ? "Cleared" : `${val}`));
    },
    [selected, selectedMulti, pushHistory]
  );

  const setMulti = useCallback(
    (traitId: string, values: MultiChoice, label?: string) => {
      const nextSel = { ...selected };
      delete nextSel[traitId];
      const nextMulti = { ...selectedMulti };
      if (values.length === 0) delete nextMulti[traitId];
      else nextMulti[traitId] = values;
      pushHistory(nextSel, nextMulti, createLog(label || traitId, `[${values.join(", ")}]`));
    },
    [selected, selectedMulti, pushHistory]
  );

  const setMultiAsNA = useCallback(
    (traitId: string, label?: string) => {
      const nextMulti = { ...selectedMulti };
      delete nextMulti[traitId];
      const nextSel = { ...selected, [traitId]: 0 };
      pushHistory(nextSel, nextMulti, createLog(label || traitId, "NA"));
    },
    [selected, selectedMulti, pushHistory]
  );

  const setDerivedPick = useCallback(
    (childrenIds: string[], chosenId: string, parentLabel?: string) => {
      const next = { ...selected };
      for (const cid of childrenIds) next[cid] = cid === chosenId ? 1 : -1;
      const chosenTrait = traits.find((t) => t.id === chosenId);
      pushHistory(next, selectedMulti, createLog(parentLabel || "(derived)", chosenTrait?.state || chosenId));
    },
    [selected, selectedMulti, traits, pushHistory]
  );

  const clearDerived = useCallback(
    (childrenIds: string[], parentLabel?: string, asNA?: boolean) => {
      const next = { ...selected };
      for (const cid of childrenIds) {
        if (asNA) next[cid] = 0;
        else delete next[cid];
      }
      pushHistory(next, selectedMulti, createLog(parentLabel || "(derived)", asNA ? "NA" : "Cleared"));
    },
    [selected, selectedMulti, pushHistory]
  );

  const clearAllSelections = useCallback(() => {
    pushHistory({}, {}, createLog("All Selections", "Cleared"));
  }, [pushHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = () => {
    if (canUndo) setHistoryIndex(historyIndex - 1);
  };
  const redo = () => {
    if (canRedo) setHistoryIndex(historyIndex + 1);
  };

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
      if (t.type === "nominal_parent") parents[t.name] = t;
      else if (t.type === "derived" && t.parent) {
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
          children: byParent[parentName].map((c) => ({ id: c.id, label: c.state || c.name })),
        });
      }
    }
    for (const t of otherTraits) {
      if (t.type === "binary") out.push({ group: t.group || "", traitName: t.name, type: "binary", binary: { ...t } });
      else if (t.type === "continuous")
        out.push({ group: t.group || "", traitName: t.name, type: "continuous", continuous: { ...t } });
      else if (t.type === "categorical_multi")
        out.push({ group: t.group || "", traitName: t.name, type: "categorical_multi", multi: { ...t } });
    }
    return out;
  }, [traits]);

  const visibleRows: TraitRow[] = useMemo(() => {
    if (!opts.applyDependencies) return rows;

    const traitMap: Record<string, Trait> = {};
    const userDefinedIdToInternalId: Record<string, string> = {};
    traits.forEach((t) => {
      traitMap[t.id] = t;
      if (t.traitId) userDefinedIdToInternalId[t.traitId] = t.id;
    });

    const derivedTraitsByParentName: Record<string, Trait[]> = {};
    traits.forEach((t) => {
      if (t.type === "derived" && t.parent) {
        if (!derivedTraitsByParentName[t.parent]) derivedTraitsByParentName[t.parent] = [];
        derivedTraitsByParentName[t.parent].push(t);
      }
    });

    const checkDependency = (trait: Trait): boolean => {
      const dep = trait.parentDependency;
      if (!dep) return true;

      const parentInternalId = userDefinedIdToInternalId[dep.parentTraitId];
      if (!parentInternalId) return true;

      const parentTrait = traitMap[parentInternalId];
      if (!parentTrait) return true;

      const parentIsSelected =
        selected[parentInternalId] !== undefined ||
        selectedMulti[parentInternalId] !== undefined ||
        (parentTrait.type === "nominal_parent" &&
          (derivedTraitsByParentName[parentTrait.name] || []).some((child) => selected[child.id] !== undefined));
      if (!parentIsSelected) return false;

      const requiredState = dep.requiredState;
      const requiredTernary =
        requiredState.toLowerCase() === "yes" ||
        requiredState.toLowerCase() === "present" ||
        requiredState === "1"
          ? 1
          : requiredState.toLowerCase() === "no" ||
            requiredState.toLowerCase() === "absent" ||
            requiredState === "-1"
          ? -1
          : 0;

      if (parentTrait.type === "binary") {
        return selected[parentInternalId] === requiredTernary;
      }

      if (parentTrait.type === "nominal_parent") {
        const children = derivedTraitsByParentName[parentTrait.name] || [];
        for (const child of children) {
          if (selected[child.id] === 1 && child.state?.toLowerCase() === requiredState.toLowerCase()) {
            return true;
          }
        }
      }

      if (parentTrait.type === "categorical_multi") {
        const selectedStates = selectedMulti[parentInternalId];
        if (selectedStates && selectedStates.some((s) => s.toLowerCase() === requiredState.toLowerCase())) {
          return true;
        }
      }

      return false;
    };

    return rows.filter((row) => {
      const trait =
        row.type === "derived"
          ? row.parentTrait
          : row.type === "binary"
          ? row.binary
          : row.type === "continuous"
          ? row.continuous
          : row.multi;
      return checkDependency(trait);
    });
  }, [rows, traits, selected, selectedMulti, opts.applyDependencies]);

  return {
    rows: visibleRows,
    traits,
    matrixName,
    taxaCount,
    selected,
    selectedMulti,
    setBinary,
    setContinuous,
    setMulti,
    setMultiAsNA,
    setDerivedPick,
    clearDerived,
    clearAllSelections,
    mode,
    setMode,
    algo,
    setAlgo,
    opts,
    setOpts,
    scores,
    suggs,
    suggMap,
    sortBy,
    setSortBy,
    suggAlgo,
    setSuggAlgo,
    pickKey,
    keys,
    activeKey,
    refreshKeys,
    history: currentHistoryLogs,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
