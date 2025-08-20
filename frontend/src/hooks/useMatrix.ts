import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnsureMyKeysAndSamples, ListMyKeys, GetCurrentKeyName, PickKey } from "../../wailsjs/go/main/App";
import { getMatrix, applyFiltersAlgoOpt, Matrix, TaxonScore, Trait, TraitSuggestion, Choice } from "../api";
import { EventsOn } from "../../wailsjs/runtime/runtime";

// 小ユーティリティ
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
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[] };

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

  // mode/algo
  const [mode, setMode] = useState<"lenient" | "strict">("lenient");
  const [algo, setAlgo] = useState<"bayes" | "heuristic">("bayes");

  // results
  const [scores, setScores] = useState<TaxonScore[]>([]);
  const [suggs, setSuggs] = useState<TraitSuggestion[]>([]);

  // 推奨アルゴ表示
  const [suggAlgo, setSuggAlgo] = useState<"gini" | "entropy">("gini");

  // 履歴
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

  // === 行列のロード ===
  const loadMatrix = useCallback(async () => {
    const m: Matrix = await getMatrix();
    setTraits(m.traits ?? []);
    setTaxaCount(m.taxa?.length ?? 0);
    setMatrixName(m.name ?? "");
  }, []);

  useEffect(() => {
    loadMatrix();
    refreshKeys();
    EventsOn("matrix_changed", loadMatrix);
  }, [loadMatrix, refreshKeys]);

  // === 選択操作 ===
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
      for (const cid of childrenIds) next[cid] = 0 as Choice;
      next[chosenId] = 1 as Choice;
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

  // === 評価（デバウンス） ===
  const runEval = useCallback(async () => {
    const res = await applyFiltersAlgoOpt(
      selected as Record<string, number>,
      mode,
      algo,
      {
        defaultAlphaFP: 0.03,
        defaultBetaFN: 0.05,
        wantInfoGain: true,
        lambda: 0,
        a0: 1, b0: 1, kappa: 1,
        tau: 0.01,
      }
    );
    setScores(res.scores || []);
    setSuggs(res.suggestions || []);
  }, [selected, mode, algo]);

  const runEvalDebounced = useDebouncedCallback(runEval, 120);
  useEffect(() => { runEvalDebounced(); }, [runEvalDebounced, selected, mode, algo]);

  // === 推奨マップ（ID -> score） ===
  const suggMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of suggs || []) {
      const id = s.traitId;
      const sc = s.score ?? s.ig ?? 0;
      if (id) m[id] = Number(sc) || 0;
    }
    return m;
  }, [suggs]);

  // === 表示用行（親まとめ） ===
  const rowsUI = useMemo(() => {
    const byParent: Record<string, Trait[]> = {};
    for (const t of traits) {
      if ((t.type || "").toLowerCase() === "derived") {
        const pid = (t.parent || "").trim();
        if (!byParent[pid]) byParent[pid] = [];
        byParent[pid].push(t);
      }
    }
    const out: TraitRow[] = [];
    for (const t of traits) {
      if ((t.type || "").toLowerCase() !== "derived") {
        const kids = [
          ...(byParent[t.id || ""] || []),
          ...(byParent[t.name || ""] || []),
        ];
        if (kids.length === 0) {
          out.push({ group: t.group || "", traitName: t.name, type: "binary", binary: { ...t } });
        } else {
          out.push({
            group: t.group || "",
            traitName: t.name,
            type: "derived",
            children: kids.map(c => ({ id: c.id, label: c.state || c.name })),
          });
        }
      }
    }
    // 親が無い子だけのケース
    for (const pid of Object.keys(byParent)) {
      if (!pid) continue;
      const exists = out.some(r => r.traitName === pid);
      if (!exists) {
        const kids = byParent[pid];
        const grp = kids[0]?.group || "";
        out.push({
          group: grp,
          traitName: pid,
          type: "derived",
          children: kids.map(c => ({ id: c.id, label: c.state || c.name })),
        });
      }
    }
    return out;
  }, [traits]);

  // 左ペインのソート
  const [sortBy, setSortBy] = useState<"recommend" | "group" | "name">("group");

  return {
    // Matrix 表示
    rows: rowsUI, traits, matrixName, taxaCount,

    // selection
    selected, setBinary, setDerivedPick, clearDerived,

    // mode / algo
    mode, setMode, algo, setAlgo,

    // results
    scores, suggs, suggMap, sortBy, setSortBy, suggAlgo, setSuggAlgo,

    // MyKeys
    pickKey, keys, activeKey, refreshKeys,

    // 履歴
    history,
  };
}
