// frontend/src/components/panels/traits/TraitsTabsPanel.tsx
import React, { useState } from 'react';
import { Box, Tab, Tabs, ButtonGroup, Button, Stack, Divider, IconButton, Tooltip } from '@mui/material';
import TraitsPanel, { TraitRow } from './TraitsPanel';
import { Trait, TraitSuggestion, MultiChoice } from '../../../api';
import { AlgoOptions } from '../../../hooks/useAlgoOpts';
import { STR } from '../../../i18n';
import ReplayIcon from '@mui/icons-material/Replay';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

type Props = {
    lang: "ja" | "en";
    rows: TraitRow[];
    selected: Record<string, number>;
    selectedMulti: Record<string, MultiChoice>;
    setBinary: (traitId: string, val: number | null, label: string) => void;
    setContinuous: (traitId: string, val: number | null, label: string) => void;
    setMulti: (traitId: string, values: MultiChoice, label: string) => void;
    setMultiAsNA: (traitId: string, label?: string) => void;
    setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
    clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
    clearAllSelections: () => void;
    sortBy: "recommend" | "group" | "name";
    setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;
    suggMap: Record<string, TraitSuggestion>;
    suggRank?: Record<string, number>;
    opts: AlgoOptions;
    setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
    onTraitSelect: (trait?: Trait) => void;
    // Undo/Redo props
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
};

export default function TraitsTabsPanel(props: Props) {
    const { lang, sortBy, setSortBy, selected, clearAllSelections, undo, redo, canUndo, canRedo } = props;
    const [activeTab, setActiveTab] = useState<"unselected" | "selected">("unselected");
    const T = STR[lang].traitsPanel;

    const hasSelections = Object.keys(selected).length > 0 || Object.values(props.selectedMulti).some(v => v.length > 0);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label={STR[lang].panels.traits_unselected} value="unselected" />
                    <Tab label={STR[lang].panels.traits_selected} value="selected" />
                </Tabs>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Undo">
                        <span><IconButton onClick={undo} disabled={!canUndo} size="small"><UndoIcon/></IconButton></span>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <span><IconButton onClick={redo} disabled={!canRedo} size="small"><RedoIcon/></IconButton></span>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem />
                    <ButtonGroup size="small" variant="outlined">
                        <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>{T.sort_recommend}</Button>
                        <Button onClick={() => setSortBy("group")} variant={sortBy === "group" ? "contained" : "outlined"}>{T.sort_group}</Button>
                        <Button onClick={() => setSortBy("name")} variant={sortBy === "name" ? "contained" : "outlined"}>{T.sort_name}</Button>
                    </ButtonGroup>
                    <Divider orientation="vertical" flexItem />
                    <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<ReplayIcon />}
                        onClick={clearAllSelections}
                        disabled={!hasSelections}
                    >
                        {T.reset_selections}
                    </Button>
                </Stack>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
                <Box sx={{ display: activeTab === 'unselected' ? 'block' : 'none', height: '100%' }}>
                    <TraitsPanel {...props} mode="unselected" />
                </Box>
                <Box sx={{ display: activeTab === 'selected' ? 'block' : 'none', height: '100%' }}>
                    <TraitsPanel {...props} mode="selected" />
                </Box>
            </Box>
        </Box>
    );
}