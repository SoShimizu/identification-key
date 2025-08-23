// frontend/src/components/header/RibbonSettingsTab.tsx
import React, { useState } from 'react';
import { Box, Tabs, Tab, Stack } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import TuneIcon from '@mui/icons-material/Tune';
import RecommendIcon from '@mui/icons-material/Recommend';
import RibbonCandidatesTab from './RibbonCandidatesTab';
import { AlgoOptions } from '../../hooks/useAlgoOpts';
import { STR } from '../../i18n';
import RibbonTraitEvalTab from './RibbonTraitEvalTab';
import RibbonTraitRecommendTab from './RibbonTraitRecommendTab';

type Props = {
  matrixName: string;
  algorithm: "bayes" | "heuristic";
  onAlgorithmChange: (algo: "bayes" | "heuristic") => void;
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonSettingsTab(props: Props) {
  const { lang } = props;
  const T = STR[lang];
  const [internalTab, setInternalTab] = useState<'candidates' | 'trait_eval' | 'trait_recommend'>('candidates');

  return (
    <Stack direction="row" spacing={2} sx={{height: '100%'}}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={internalTab}
        onChange={(_, newValue) => setInternalTab(newValue)}
        aria-label="Vertical settings tabs"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        <Tab icon={<ScienceIcon />} iconPosition="start" label={T.ribbon.candidates_settings_short} value="candidates" />
        <Tab icon={<TuneIcon />} iconPosition="start" label={T.ribbon.traits_settings_short} value="trait_eval" />
        <Tab icon={<RecommendIcon />} iconPosition="start" label={T.ribbon.recommend_settings_short} value="trait_recommend" />
      </Tabs>
      <Box sx={{width: '100%', pt:1, overflowY: 'auto'}}>
        {internalTab === 'candidates' && <RibbonCandidatesTab {...props} />}
        {internalTab === 'trait_eval' && <RibbonTraitEvalTab {...props} />}
        {internalTab === 'trait_recommend' && <RibbonTraitRecommendTab {...props} />}
      </Box>
    </Stack>
  );
}