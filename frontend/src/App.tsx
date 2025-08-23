// frontend/src/App.tsx
import React, { useState, useMemo, useEffect } from "react";
import { CssBaseline, ThemeProvider, createTheme, Box, Drawer, Paper, Typography } from "@mui/material";
import { useMatrix } from "./hooks/useMatrix";
import Ribbon from "./components/header/Ribbon";
import CandidatesPanel from "./components/panels/candidates/CandidatesPanel";
import ComparisonPanel from "./components/panels/comparison/ComparisonPanel";
import TraitsTabsPanel from "./components/panels/traits/TraitsTabsPanel";
import TaxonDetailPanel from "./components/panels/taxa/TaxonDetailPanel";
import HelpDisplay from "./components/panels/traits/HelpDisplay";
import { STR } from "./i18n";
import { Choice, Taxon, Trait } from "./api";
import MatrixInfoPanel from "./components/panels/matrix/MatrixInfoPanel";

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const ResizerX = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <Box onMouseDown={onMouseDown} sx={{ width: '8px', cursor: 'col-resize', bgcolor: 'divider', transition: 'background-color 0.2s ease', '&:hover': { bgcolor: 'primary.main' }, borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{width: '2px', height: '30px', bgcolor: 'background.default', borderRadius: '1px'}} />
    </Box>
);
const ResizerY = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <Box onMouseDown={onMouseDown} sx={{ height: '8px', cursor: 'row-resize', bgcolor: 'divider', transition: 'background-color 0.2s ease', '&:hover': { bgcolor: 'primary.main' }, borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{height: '2px', width: '30px', bgcolor: 'background.default', borderRadius: '1px'}} />
    </Box>
);

export default function App() {
  const {
    matrixInfo,
    matrixName, taxaCount, rows, traits,
    selected, selectedMulti, setBinary, setContinuous, setMulti, setMultiAsNA, setDerivedPick, clearDerived, clearAllSelections,
    scores, suggMap, sortBy, setSortBy,
    algo, setAlgo,
    opts, setOpts,
    keys, activeKey, pickKey, refreshKeys,
    history, undo, redo, canUndo, canRedo,
    lang, setLang,
  } = useMatrix();

  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("dark");
  const [comparisonList, setComparisonList] = React.useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  const [detailView, setDetailView] = useState<{ type: 'trait'; content: Trait } | { type: 'taxon'; content: Taxon } | null>(null);
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [leftTopPanelHeight, setLeftTopPanelHeight] = useState(40);
  const [rightTopPanelHeight, setRightTopPanelHeight] = useState(50);

  const handleMouseDownX = (e: React.MouseEvent) => {
      e.preventDefault();
      const handleMouseMove = (event: MouseEvent) => {
          const newLeftWidth = (event.clientX / window.innerWidth) * 100;
          if (newLeftWidth > 20 && newLeftWidth < 80) setLeftPanelWidth(newLeftWidth);
      };
      const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  };

  const createVerticalResizer = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.MouseEvent) => {
      e.preventDefault();
      const panelElement = e.currentTarget.parentElement;
      if (!panelElement) return;

      const handleMouseMove = (event: MouseEvent) => {
          const bounds = panelElement.getBoundingClientRect();
          const newTopHeight = ((event.clientY - bounds.top) / bounds.height) * 100;
          if (newTopHeight > 15 && newTopHeight < 85) setter(newTopHeight);
      };
      const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  };

  const allTaxa = React.useMemo(() => {
    return scores.map(s => s.taxon as Taxon);
  }, [scores]);

  const handleTraitSelect = (trait?: Trait) => {
    if (trait) {
        setDetailView({ type: 'trait', content: trait });
    }
  };
  
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
  
  const candRows = React.useMemo(() => {
    return (scores || []).map((s: any, i: number) => ({
      rank: i + 1,
      taxon: s.taxon,
      post: s?.post ?? s?.score ?? 0,
      delta: s?.delta ?? 0,
      used: s?.used ?? 0,
      conflicts: s?.conflicts ?? s?.contradictions ?? 0,
      match: s?.match ?? 0,
      support: s?.support ?? 0,
    }));
  }, [scores]);
  
  useEffect(() => {
      if (scores && scores.length > 0) {
          if (detailView?.type !== 'trait') {
              setDetailView({type: 'taxon', content: scores[0].taxon});
          }
      } else {
          setDetailView(null);
      }
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
          matrixInfo={matrixInfo}
          matrixName={matrixName}
          history={history}
          scores={scores}
        />
         <Box sx={{ flex: 1, p: 2, gap: 1, display: 'flex', flexDirection: 'row', height: 'calc(100vh - 48px)' }}>
            {/* Left Panel: Info */}
            <Box sx={{ width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, minWidth: '250px' }}>
                <Box sx={{ height: `${leftTopPanelHeight}%`, minHeight: '100px' }}>
                    <MatrixInfoPanel info={matrixInfo} lang={lang} />
                </Box>

                <ResizerY onMouseDown={createVerticalResizer(setLeftTopPanelHeight)} />
                
                <Box sx={{ flex: 1, minHeight: '100px' }}>
                    {detailView?.type === 'taxon' && <TaxonDetailPanel taxon={detailView.content} lang={lang} />}
                    {detailView?.type === 'trait' && <HelpDisplay trait={detailView.content} lang={lang} />}
                    {!detailView && (
                        <Paper variant="outlined" sx={{height: '100%', p:2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <Typography color="text.secondary">Select a taxon to see details or a trait to see help.</Typography>
                        </Paper>
                    )}
                </Box>
            </Box>

            <ResizerX onMouseDown={handleMouseDownX} />

            {/* Right Panel: Interaction */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, minWidth: '400px' }}>
                 <Box sx={{ height: `${rightTopPanelHeight}%`, minHeight: '150px' }}>
                    <CandidatesPanel
                        lang={lang}
                        title={T.panels.candidates}
                        rows={candRows}
                        totalTaxa={taxaCount || 0}
                        algo={algo}
                        comparisonList={comparisonList}
                        setComparisonList={setComparisonList}
                        onCompareClick={() => setComparisonOpen(true)}
                        onTaxonSelect={(taxon) => setDetailView({type: 'taxon', content: taxon})}
                        selected={selected}
                        selectedMulti={selectedMulti}
                    />
                </Box>
                
                <ResizerY onMouseDown={createVerticalResizer(setRightTopPanelHeight)} />

                <Box sx={{ flex: 1, minHeight: '100px' }}>
                    <TraitsTabsPanel
                        lang={lang}
                        rows={rows}
                        selected={selected as Record<string, number>}
                        selectedMulti={selectedMulti}
                        setBinary={(id, val, label) => setBinary(id, val as Choice, label)}
                        setContinuous={setContinuous}
                        setMulti={setMulti}
                        setMultiAsNA={setMultiAsNA}
                        setDerivedPick={setDerivedPick}
                        clearDerived={clearDerived}
                        clearAllSelections={clearAllSelections}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        suggMap={suggMap}
                        onTraitSelect={handleTraitSelect}
                        opts={opts}
                        setOpts={setOpts}
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </Box>
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
