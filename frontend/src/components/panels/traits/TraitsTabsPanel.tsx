// frontend/src/components/panels/traits/TraitsTabsPanel.tsx
import React, { useState } from 'react';
import { Box, Tab, Tabs, ButtonGroup, Button, Stack, FormControlLabel, Switch, Typography } from '@mui/material';
import TraitsPanel, { TraitRow } from './TraitsPanel';
import HelpDisplay from './HelpDisplay';
import { Trait, TraitSuggestion } from '../../../api';
import { AlgoOptions } from '../../../hooks/useAlgoOpts';
import { STR } from '../../../i18n';

type Props = {
    lang: "ja" | "en";
    rows: TraitRow[];
    selected: Record<string, number>;
    setBinary: (traitId: string, val: number, label: string) => void;
    setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
    clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
    sortBy: "recommend" | "group" | "name";
    setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;
    suggMap: Record<string, TraitSuggestion>;
    suggRank?: Record<string, number>;
    opts: AlgoOptions;
    setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
};

export default function TraitsTabsPanel(props: Props) {
    const { lang, sortBy, setSortBy, opts, setOpts } = props;
    const [activeTab, setActiveTab] = useState<"unselected" | "selected">("unselected");
    const [activeTrait, setActiveTrait] = useState<Trait | undefined>(undefined);
    const T = STR[lang].traitsPanel;

    const handleTraitSelect = (trait?: Trait) => {
        setActiveTrait(trait);
    };

    const handleBool = (key: keyof AlgoOptions) => (_: any, checked: boolean) => {
      setOpts({ ...opts, [key]: checked });
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ✨ 修正: タブとボタンを同じ行に配置 */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="未選択の形質" value="unselected" />
                    <Tab label="選択済みの形質" value="selected" />
                </Tabs>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {sortBy === 'recommend' && activeTab === 'unselected' && (
                        <FormControlLabel 
                            control={<Switch size="small" checked={opts.usePragmaticScore} onChange={handleBool("usePragmaticScore")} />} 
                            label={<Typography variant="caption">実用性スコア</Typography>}
                        />
                    )}
                    <ButtonGroup size="small" variant="outlined">
                        <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>{T.sort_recommend}</Button>
                        <Button onClick={() => setSortBy("group")} variant={sortBy === "group" ? "contained" : "outlined"}>{T.sort_group}</Button>
                        <Button onClick={() => setSortBy("name")} variant={sortBy === "name" ? "contained" : "outlined"}>{T.sort_name}</Button>
                    </ButtonGroup>
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
                    <HelpDisplay trait={activeTrait} />
                </Box>
            </Box>
        </Box>
    );
}