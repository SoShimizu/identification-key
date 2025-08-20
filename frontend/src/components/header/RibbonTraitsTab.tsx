// frontend/src/components/header/RibbonTraitsTab.tsx
import React, { useMemo } from "react";
import {
  Box, FormControlLabel, Slider, Stack, Switch, Tooltip, Typography
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { AlgoOptions, clampAlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

type Props = {
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

// A helper component for a labeled slider
const LabeledSlider = ({ label, tooltip, value, min, max, step, onChange, valueFormat }: {
    label: string; tooltip: string; value: number; min: number; max: number; step: number;
    onChange: (event: Event, value: number | number[]) => void;
    valueFormat?: (v: number) => string;
}) => (
    <Box>
        <Stack spacing={1}>
            <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                <Typography variant="body2">{label}</Typography>
                <Tooltip title={tooltip}><InfoOutlinedIcon fontSize="small" /></Tooltip>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right' }}>{valueFormat ? valueFormat(min) : min}</Typography>
                <Slider 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={value} 
                    onChange={onChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={valueFormat}
                />
                <Typography variant="caption" sx={{ minWidth: 35 }}>{valueFormat ? valueFormat(max) : max}</Typography>
            </Stack>
        </Stack>
    </Box>
);

export default function RibbonTraitsTab({ opts, setOpts, lang }: Props) {
  const T = STR[lang].traitsTab;
  const saneOpts = useMemo(() => clampAlgoOptions(opts), [opts]);

  const handleBool = (key: keyof AlgoOptions) => (_: any, checked: boolean) => {
      setOpts(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, alignItems: "start" }}>
        <Box>
            <FormControlLabel 
                control={<Switch checked={opts.usePragmaticScore} onChange={handleBool("usePragmaticScore")} />} 
                label={<Typography variant="body2">{T.pragmatic_score}</Typography>}
            />
            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                {T.pragmatic_score_tooltip}
            </Typography>
        </Box>
        <LabeledSlider
            label={T.param_tolerance}
            tooltip={T.tooltip_tolerance}
            value={saneOpts.toleranceFactor}
            min={0} max={0.5} step={0.01}
            onChange={(_, v) => setOpts((prev: AlgoOptions) => ({ ...prev, toleranceFactor: v as number }))}
            valueFormat={v => `${(v*100).toFixed(0)}%`}
        />
    </Box>
  );
}