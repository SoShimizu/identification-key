// frontend/src/App.tsx
import React from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Ribbon from "./components/header/Ribbon";
import { useMatrix } from "./hooks/useMatrix";
import TraitsPanel from "./components/panels/traits/TraitsPanel";
import HistoryPanel from "./components/panels/history/HistoryPanel";
import CandidatesPanel, { EngineScore } from "./components/panels/candidates/CandidatesPanel";

export type PanelKey = "candidates" | "traits_unselected" | "traits_selected" | "history";
export type LayoutState = { tl: PanelKey; tr: PanelKey; bl: PanelKey; br: PanelKey };

const DEFAULT_LAYOUT: LayoutState = {
  tl: "candidates",
  tr: "history",
  bl: "traits_unselected",
  br: "traits_selected",
};

function loadLayout(): LayoutState {
  try {
    const s = localStorage.getItem("mk.layout.v2");
    return s ? { ...DEFAULT_LAYOUT, ...JSON.parse(s) } : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}
function saveLayout(v: LayoutState) {
  localStorage.setItem("mk.layout.v2", JSON.stringify(v));
}

export default function App() {
  const {
    matrixName, taxaCount, rows,
    selected, setBinary, setDerivedPick, clearDerived,
    scores, suggMap, sortBy, setSortBy, suggAlgo, setSuggAlgo,
    mode, setMode, algo, setAlgo,
    keys, activeKey, pickKey, refreshKeys,
    history,
  } = useMatrix();

  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("dark");
  const [layout, setLayout] = React.useState<LayoutState>(() => loadLayout());
  const [showMatchSupport, setShowMatchSupport] = React.useState<boolean>(false);
  const [lang, setLang] = React.useState<"ja" | "en">("ja");

  const theme = React.useMemo(
    () => createTheme({ palette: { mode: themeMode }, typography: { fontSize: 13 } }),
    [themeMode]
  );

  // suggMap -> suggRank
  const suggRank: Record<string, number> = React.useMemo(() => {
    const m = suggMap || {};
    const entries = Object.entries(m).filter(([, v]) => typeof v === "number" && isFinite(v));
    entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    const rank: Record<string, number> = {};
    entries.forEach(([id], i) => { rank[id] = i + 1; });
    return rank;
  }, [suggMap]);

  const candRows: EngineScore[] = React.useMemo(() => {
    return (scores || []).map((s: any, i: number) => ({
      rank: i + 1,
      taxon: { id: s?.taxon?.id ?? s?.taxon?.ID ?? String(i), name: s?.taxon?.name ?? s?.taxon?.Name ?? "" },
      post: s?.post ?? s?.score ?? 0,
      delta: s?.delta ?? 0,
      used: s?.used ?? 0,
      conflicts: s?.conflicts ?? s?.contradictions ?? 0,
      match: s?.match ?? 0,
      support: s?.support ?? 0,
    }));
  }, [scores]);

  const renderPanel = (k: PanelKey) => {
    switch (k) {
      case "candidates":
        return (
          <CandidatesPanel
            title={matrixName || "候補タクサ"}
            rows={candRows}
            totalTaxa={taxaCount || 0}
            showMatchSupport={showMatchSupport}
          />
        );
      case "history":
        return <HistoryPanel title="選択履歴" items={history as any} />;
      case "traits_unselected":
        return (
          <TraitsPanel
            title="未選択の形質"
            mode="unselected"
            rows={rows}
            selected={selected as Record<string, number>}
            setBinary={(id, val, label) => setBinary(id, val as any, label)}
            setDerivedPick={setDerivedPick}
            clearDerived={clearDerived}
            sortBy={sortBy}
            setSortBy={setSortBy}
            suggMap={suggMap}
            suggRank={suggRank}
            suggAlgo={suggAlgo}
            setSuggAlgo={(a) => setSuggAlgo(a)}  // ★ adapter
          />
        );
      case "traits_selected":
        return (
          <TraitsPanel
            title="選択済みの形質"
            mode="selected"
            rows={rows}
            selected={selected as Record<string, number>}
            setBinary={(id, val, label) => setBinary(id, val as any, label)}
            setDerivedPick={setDerivedPick}
            clearDerived={clearDerived}
            sortBy={sortBy}
            setSortBy={setSortBy}
            suggMap={suggMap}
            suggRank={suggRank}
            suggAlgo={suggAlgo}
            setSuggAlgo={(a) => setSuggAlgo(a)}  // ★ adapter
          />
        );
    }
  };

  const handleLayoutChange = (v: LayoutState) => { setLayout(v); saveLayout(v); };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Ribbon
        // Ribbon 必須
        matrixName={matrixName || ""}               // ★ 追加
        selected={selected as Record<string, number>} // ★ 追加

        // i18n / keys / A2
        lang={lang} setLang={setLang}
        keys={keys} activeKey={activeKey} onPickKey={pickKey} onRefreshKeys={refreshKeys}
        mode={mode} setMode={setMode}
        algo={algo} setAlgo={setAlgo}

        // 表示系
        themeMode={themeMode} setThemeMode={setThemeMode}
        layout={layout} onLayoutChange={handleLayoutChange}
        showMatchSupport={showMatchSupport} setShowMatchSupport={setShowMatchSupport}

        onHelp={() => alert("Help is coming soon…")}
      />

      {/* 2×2 レイアウト */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gridTemplateRows: { xs: "auto auto auto auto", md: "minmax(44vh, auto) minmax(44vh, auto)" },
          }}
        >
          <Box sx={{ height: { xs: "45vh", md: "44vh" }, overflow: "hidden" }}>{renderPanel(layout.tl)}</Box>
          <Box sx={{ height: { xs: "45vh", md: "44vh" }, overflow: "hidden" }}>{renderPanel(layout.tr)}</Box>
          <Box sx={{ height: { xs: "45vh", md: "44vh" }, overflow: "hidden" }}>{renderPanel(layout.bl)}</Box>
          <Box sx={{ height: { xs: "45vh", md: "44vh" }, overflow: "hidden" }}>{renderPanel(layout.br)}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
