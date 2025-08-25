// frontend/src/components/tabs/key/KeyTabPanel.tsx
import React, { useState } from 'react';
import { Box, Drawer, Paper, Typography } from '@mui/material';
import CandidatesPanel from '../../panels/candidates/CandidatesPanel';
import ComparisonPanel from '../../panels/comparison/ComparisonPanel';
import TraitsTabsPanel from '../../panels/traits/TraitsTabsPanel';
import TaxonDetailPanel from '../../panels/taxa/TaxonDetailPanel';
import HelpDisplay from '../../panels/traits/HelpDisplay';
import { STR } from '../../../i18n';
import { Taxon, Trait } from '../../../api';
import MatrixInfoPanel from '../../panels/matrix/MatrixInfoPanel';
import { UseMatrixReturn } from '../../../hooks/useMatrix'; // ★ インポート

const ResizerX = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <Box onMouseDown={onMouseDown} sx={{ width: '8px', cursor: 'col-resize', bgcolor: 'divider', transition: 'background-color 0.2s ease', '&:hover': { bgcolor: 'primary.main' }, borderRadius: '4px', my: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{width: '2px', height: '30px', bgcolor: 'background.default', borderRadius: '1px'}} />
    </Box>
);
const ResizerY = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <Box onMouseDown={onMouseDown} sx={{ height: '8px', cursor: 'row-resize', bgcolor: 'divider', transition: 'background-color 0.2s ease', '&:hover': { bgcolor: 'primary.main' }, borderRadius: '4px', mx: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{height: '2px', width: '30px', bgcolor: 'background.default', borderRadius: '1px'}} />
    </Box>
);

// ★ Propsの型を定義
interface KeyTabPanelProps {
    matrixState: UseMatrixReturn;
}

export const KeyTabPanel: React.FC<KeyTabPanelProps> = ({ matrixState }) => { // ★ Propsを受け取る
    const {
        matrixInfo,
        taxaCount, rows, traits,
        selected, selectedMulti, setBinary, setContinuous, setMulti, setMultiAsNA, setDerivedPick, clearDerived, clearAllSelections,
        scores, suggMap, sortBy, setSortBy,
        algo,
        opts, setOpts,
        undo, redo, canUndo, canRedo,
        lang,
    } = matrixState; // ★ 受け取ったPropsから状態を展開

    const [comparisonList, setComparisonList] = useState<string[]>([]);
    const [comparisonOpen, setComparisonOpen] = useState(false);
    const [detailView, setDetailView] = useState<{ type: 'trait'; content: Trait } | { type: 'taxon'; content: Taxon } | null>(null);
    
    const [leftPanelWidth, setLeftPanelWidth] = useState(35);
    const [leftTopPanelHeight, setLeftTopPanelHeight] = useState(40);
    const [rightTopPanelHeight, setRightTopPanelHeight] = useState(40);

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
    
    React.useEffect(() => {
        if (scores && scores.length > 0) {
            if (detailView?.type !== 'trait') {
                setDetailView({type: 'taxon', content: scores[0].taxon});
            }
        } else {
            setDetailView(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scores]);


    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, p: 1, gap: 1, display: 'flex', flexDirection: 'row', height: '100%', overflow: 'hidden' }}>
                <Box sx={{ width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, minWidth: '250px' }}>
                    <Paper elevation={2} sx={{ height: `${leftTopPanelHeight}%`, minHeight: '100px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <MatrixInfoPanel info={matrixInfo} lang={lang} />
                    </Paper>

                    <ResizerY onMouseDown={createVerticalResizer(setLeftTopPanelHeight)} />
                    
                    <Paper elevation={2} sx={{ flex: 1, minHeight: '100px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {detailView?.type === 'taxon' && <TaxonDetailPanel taxon={detailView.content} lang={lang} />}
                        {detailView?.type === 'trait' && <HelpDisplay trait={detailView.content} lang={lang} />}
                        {!detailView && (
                            <Box sx={{height: '100%', width: '100%', p:2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Typography color="text.secondary">Select a taxon to see details or a trait to see help.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>

                <ResizerX onMouseDown={handleMouseDownX} />

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, minWidth: '400px' }}>
                    <Paper elevation={2} sx={{ height: `${rightTopPanelHeight}%`, minHeight: '150px', display: 'flex' }}>
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
                    </Paper>
                    
                    <ResizerY onMouseDown={createVerticalResizer(setRightTopPanelHeight)} />

                    <Paper elevation={2} sx={{ flex: 1, minHeight: '100px', display: 'flex' }}>
                        <TraitsTabsPanel
                            lang={lang}
                            rows={rows}
                            selected={selected as Record<string, number>}
                            selectedMulti={selectedMulti}
                            setBinary={setBinary}
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
                    </Paper>
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
    );
};