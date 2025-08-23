// frontend/src/components/header/RibbonTraitEvalTab.tsx
import React, { useMemo } from "react";
import { Box, Slider, Stack, Typography, RadioGroup, Radio, FormControl, Card, CardContent, CardHeader, FormControlLabel } from "@mui/material";
import StraightenIcon from '@mui/icons-material/Straighten';
import HubIcon from '@mui/icons-material/Hub';
import { AlgoOptions, clampAlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

type Props = {
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonTraitEvalTab({ opts, setOpts, lang }: Props) {
  const T = STR[lang].traitsTab;
  const saneOpts = useMemo(() => clampAlgoOptions(opts), [opts]);

  const handleRadio = (key: keyof AlgoOptions) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setOpts(prev => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <Stack direction={{xs: "column", lg: "row"}} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
            <CardHeader avatar={<StraightenIcon color="action" />} title={T.param_continuous.title} titleTypographyProps={{variant: 'h6'}} />
            <CardContent>
                <Typography variant="subtitle2" gutterBottom>{T.param_tolerance.name}</Typography>
                <Typography variant="caption" color="text.secondary" paragraph>{T.param_tolerance.description}</Typography>
                <Slider value={saneOpts.toleranceFactor} onChange={(_, v) => setOpts(p => ({ ...p, toleranceFactor: v as number }))} min={0} max={0.5} step={0.01} valueLabelDisplay="auto" valueLabelFormat={v => `${(v*100).toFixed(0)}%`} />
            </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
             <CardHeader avatar={<HubIcon color="action" />} title={T.param_multi.title} titleTypographyProps={{variant: 'h6'}} />
             <CardContent>
                <FormControl>
                    <Typography variant="subtitle2" gutterBottom>{T.categorical_algo.name}</Typography>
                    <RadioGroup row value={opts.categoricalAlgo} onChange={handleRadio("categoricalAlgo")}>
                        <FormControlLabel value="binary" control={<Radio size="small" />} label="Binary" />
                        <FormControlLabel value="jaccard" control={<Radio size="small" />} label="Jaccard" />
                    </RadioGroup>
                </FormControl>
                <Box sx={{opacity: opts.categoricalAlgo === 'jaccard' ? 1 : 0.5, mt: 2}}>
                    <Typography variant="subtitle2" gutterBottom>{T.jaccard_threshold.name}</Typography>
                     <Typography variant="caption" color="text.secondary" paragraph>{T.jaccard_threshold.description}</Typography>
                    <Slider disabled={opts.categoricalAlgo !== 'jaccard'} value={saneOpts.jaccardThreshold} onChange={(_, v) => setOpts(p => ({ ...p, jaccardThreshold: v as number }))} min={0} max={1} step={0.01} valueLabelDisplay="auto" />
                </Box>
             </CardContent>
        </Card>
    </Stack>
  );
}