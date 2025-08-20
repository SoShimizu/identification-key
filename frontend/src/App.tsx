// frontend/src/App.tsx
import React from "react";
import { CssBaseline, ThemeProvider, createTheme, Box, Chip } from "@mui/material";
import { useMatrix } from "./hooks/useMatrix";
import Ribbon from "./components/header/Ribbon";
import TraitsPanel from "./components/panels/traits/TraitsPanel";
import HistoryPanel from "./components/panels/history/HistoryPanel";
import CandidatesPanel, { EngineScore } from "./components/panels/candidates/CandidatesPanel";
import { STR } from "./i18n";

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

export type PanelKey = "candidates" | "traits_unselected" | "traits_selected" | "history";
export type LayoutState = { tl: PanelKey; tr: PanelKey; bl: PanelKey; br: PanelKey };

const DEFAULT_LAYOUT: LayoutState = {
  tl: "candidates",
  tr: "traits_unselected",
  bl: "history",
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

  const T = STR[lang];

  const theme = React.useMemo(
    () => createTheme({
      palette: {
        mode: themeMode,
        ...(themeMode === 'dark' ? {
          background: { default: '#0c111c', paper: '#1f2937' },
        } : {
          background: { default: '#f8f9fa', paper: '#ffffff' },
        })
      },
      typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: 13,
        h6: { fontWeight: 700 },
      },
      components: {
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } }
      }
    }),
    [themeMode]
  );

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
        return <CandidatesPanel lang={lang} title={T.panels.candidates} rows={candRows} totalTaxa={taxaCount || 0} showMatchSupport={showMatchSupport} />;
      case "history":
        return <HistoryPanel title={T.panels.history} items={history as any} />;
      case "traits_unselected":
        return (
          <TraitsPanel
            lang={lang}
            title={T.panels.traits_unselected}
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
          />
        );
      case "traits_selected":
        return (
          <TraitsPanel
            lang={lang}
            title={T.panels.traits_selected}
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
          />
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        <Ribbon
          lang={lang} setLang={setLang}
          matrixName={matrixName || ""}
          selected={selected as Record<string, number>}
          keys={keys} activeKey={activeKey} onPickKey={pickKey} onRefreshKeys={refreshKeys}
          mode={mode} setMode={setMode}
          algo={algo} setAlgo={setAlgo}
          themeMode={themeMode} setThemeMode={setThemeMode}
          layout={layout} onLayoutChange={(v) => { setLayout(v); saveLayout(v); }}
          showMatchSupport={showMatchSupport} setShowMatchSupport={setShowMatchSupport}
          onHelp={() => alert("Help is coming soon…")}
        />
        <Box
          sx={{
            flex: 1,
            p: 2,
            gap: 2,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            height: "calc(100vh - 48px)",
          }}
        >
          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{renderPanel(layout.tl)}</Box>
          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{renderPanel(layout.tr)}</Box>
          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{renderPanel(layout.bl)}</Box>
          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{renderPanel(layout.br)}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}