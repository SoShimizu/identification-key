// frontend/src/components/panels/traits/TraitsTabsPanel.tsx
import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import TraitsPanel from './TraitsPanel';
import HelpDisplay from './HelpDisplay';
import { TraitRow } from '../../../hooks/useMatrix';
import { Trait, TraitSuggestion } from '../../../api';
import { AlgoOptions } from '../../../hooks/useAlgoOpts';

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
    const [activeTab, setActiveTab] = useState<"unselected" | "selected">("unselected");
    const [activeTrait, setActiveTrait] = useState<Trait | undefined>(undefined);

    const handleTraitSelect = (trait: Trait) => {
        setActiveTrait(trait);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="未選択の形質" value="unselected" />
                    <Tab label="選択済みの形質" value="selected" />
                </Tabs>
            </Box>
            {/* GridをFlexboxレイアウトに置き換え */}
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