// frontend/src/components/panels/traits/TraitsTabsPanel.tsx
import React, { useState } from 'react';
import { Box, Tab, Tabs, ButtonGroup, Button, Stack, FormControlLabel, Switch, Typography, Divider } from '@mui/material';
import TraitsPanel, { TraitRow } from './TraitsPanel';
import HelpDisplay from './HelpDisplay';
import { Trait, TraitSuggestion } from '../../../api';
import { AlgoOptions } from '../../../hooks/useAlgoOpts';
import { STR } from '../../../i18n';
import ReplayIcon from '@mui/icons-material/Replay';

type Props = {
    lang: "ja" | "en";
    rows: TraitRow[];
    selected: Record<string, number>;
    setBinary: (traitId: string, val: number, label: string) => void;
    setContinuous: (traitId: string, val: number | null, label: string) => void;
    setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
    clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
    clearAllSelections: () => void;
    sortBy: "recommend" | "group" | "name";
    setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;
    suggMap: Record<string, TraitSuggestion>;
    suggRank?: Record<string, number>;
    opts: AlgoOptions;
    setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
};

export default function TraitsTabsPanel(props: Props) {
    const { lang, sortBy, setSortBy, opts, setOpts, selected, clearAllSelections } = props;
    const [activeTab, setActiveTab] = useState<"unselected" | "selected">("unselected");
    const [activeTrait, setActiveTrait] = useState<Trait | undefined>(undefined);
    const T = STR[lang].traitsPanel;

    const handleTraitSelect = (trait?: Trait) => {
        setActiveTrait(trait);
    };

    const hasSelections = Object.keys(selected).length > 0;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label={STR[lang].panels.traits_unselected} value="unselected" />
                    <Tab label={STR[lang].panels.traits_selected} value="selected" />
                </Tabs>
                <Stack direction="row" alignItems="center" spacing={1}>
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
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 2, gap: 2, minHeight: 0 }}>
                <Box sx={{ flex: { md: 8 }, height: '100%', minHeight: 0 }}>
                    <Box sx={{ display: activeTab === 'unselected' ? 'block' : 'none', height: '100%' }}>
                        <TraitsPanel {...props} mode="unselected" onTraitSelect={handleTraitSelect} />
                    </Box>
                    <Box sx={{ display: activeTab === 'selected' ? 'block' : 'none', height: '100%' }}>
                        <TraitsPanel {...props} mode="selected" onTraitSelect={handleTraitSelect} />
                    </Box>
                </Box>
                <Box sx={{ flex: { md: 4 }, height: '100%' }}>
                    <HelpDisplay trait={activeTrait} lang={lang} />
                </Box>
            </Box>
        </Box>
    );
}