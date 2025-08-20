// frontend/src/App.tsx
import React from "react";
import { CssBaseline, ThemeProvider, createTheme, Box, Drawer } from "@mui/material";
import { useMatrix } from "./hooks/useMatrix";
import Ribbon from "./components/header/Ribbon";
import CandidatesPanel, { EngineScore } from "./components/panels/candidates/CandidatesPanel";
import ComparisonPanel from "./components/panels/comparison/ComparisonPanel";
import TraitsTabsPanel from "./components/panels/traits/TraitsTabsPanel";
import { STR } from "./i18n";
import { Choice, Taxon } from "./api";

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

export default function App() {
  const {
    matrixName, taxaCount, rows, traits,
    selected, setBinary, setContinuous, setDerivedPick, clearDerived, clearAllSelections,
    scores, suggMap, sortBy, setSortBy,
    mode, setMode,
    algo, setAlgo,
    opts, setOpts,
    keys, activeKey, pickKey, refreshKeys,
    history,
  } = useMatrix();

  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("dark");
  const [lang, setLang] = React.useState<"ja" | "en">("ja");
  const [comparisonList, setComparisonList] = React.useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  
  const allTaxa = React.useMemo(() => {
    const matrixTaxa = scores.map(s => s.taxon);
    return matrixTaxa as Taxon[];
  }, [scores]);

  const T = STR[lang];

  const theme = React.useMemo(
    () => createTheme({
      palette: {
        mode: themeMode,
        ...(themeMode === 'dark' ? {
          background: { default: '#0c111c', paper: '#1f2937' },
          text: { primary: '#e7f0f8', secondary: '#9fb4c7' },
        } : {
          background: { default: '#f8f9fa', paper: '#ffffff' },
          text: { primary: '#212529', secondary: '#6c757d' },
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
    const entries = Object.entries(m);
    entries.sort(([, suggA], [, suggB]) => (suggB?.score ?? -1) - (suggA?.score ?? -1));
    const rank: Record<string, number> = {};
    entries.forEach(([, suggestion], i) => {
        if (suggestion && suggestion.traitId) {
            rank[suggestion.traitId] = i + 1;
        }
    });
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        <Ribbon
          lang={lang} setLang={setLang}
          keys={keys} activeKey={activeKey} onPickKey={pickKey} onRefreshKeys={refreshKeys}
          algo={algo} setAlgo={setAlgo}
          themeMode={themeMode} setThemeMode={setThemeMode}
          opts={opts} setOpts={setOpts}
          matrixName={matrixName}
        />
        <Box
          sx={{
            flex: 1,
            p: 2,
            gap: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 48px)',
            position: 'relative',
          }}
        >
          <Box sx={{ flex: 2, minHeight: 0 }}>
            <CandidatesPanel
              lang={lang}
              title={T.panels.candidates}
              rows={candRows}
              totalTaxa={taxaCount || 0}
              algo={algo}
              comparisonList={comparisonList}
              setComparisonList={setComparisonList}
              onCompareClick={() => setComparisonOpen(true)}
            />
          </Box>
          <Box sx={{ flex: 3, minHeight: 0 }}>
             <TraitsTabsPanel
                lang={lang}
                rows={rows}
                selected={selected as Record<string, number>}
                setBinary={(id, val, label) => setBinary(id, val as Choice, label)}
                setContinuous={setContinuous}
                setDerivedPick={setDerivedPick}
                clearDerived={clearDerived}
                clearAllSelections={clearAllSelections}
                sortBy={sortBy}
                setSortBy={setSortBy}
                suggMap={suggMap}
                suggRank={suggRank}
                opts={opts}
                setOpts={setOpts}
             />
          </Box>
        </Box>
        <Drawer
            anchor="bottom"
            open={comparisonOpen}
            onClose={() => setComparisonOpen(false)}
            PaperProps={{ sx: { height: '60vh' } }}
        >
            <ComparisonPanel
                lang={lang}
                allTraits={traits}
                allTaxa={allTaxa}
                comparisonList={comparisonList}
                onClose={() => setComparisonOpen(false)}
            />
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}