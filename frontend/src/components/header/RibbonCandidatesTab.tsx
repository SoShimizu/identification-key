// frontend/src/components/header/RibbonCandidatesTab.tsx
import React, { useMemo } from "react";
import {
  Box, Divider, FormControl, InputLabel,
  MenuItem, Select, SelectChangeEvent, Slider, Stack, Tooltip, Typography, Button
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useAlgoOpts, AlgoOptions, clampAlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

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
                <Typography variant="caption" sx={{ minWidth: 25, textAlign: 'right' }}>{min}</Typography>
                <Slider 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={value} 
                    onChange={onChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={valueFormat}
                />
                <Typography variant="caption" sx={{ minWidth: 25 }}>{max}</Typography>
            </Stack>
        </Stack>
    </Box>
);

// Props type definition was missing
type Props = {
  matrixName: string;
  algorithm?: "bayes" | "heuristic";
  onAlgorithmChange?: (algo: "bayes" | "heuristic") => void;
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonCandidatesTab(props: Props) {
  const {
    matrixName, lang,
    algorithm = "bayes", onAlgorithmChange,
    opts, setOpts,
  } = props;

  const T = STR[lang].candidatesTab;
  const { reset } = useAlgoOpts(matrixName);
  
  const saneOpts = useMemo(() => clampAlgoOptions(opts), [opts]);

  return (
    <Box>
      <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{T.algorithm}</InputLabel>
          <Select label={T.algorithm} value={algorithm} onChange={(e: SelectChangeEvent) => onAlgorithmChange?.(e.target.value as any)}>
            <MenuItem value="bayes">Bayes</MenuItem>
            <MenuItem value="heuristic">Heuristic</MenuItem>
          </Select>
        </FormControl>
        <Button variant="text" onClick={reset} >{T.reset_defaults}</Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {algorithm === 'bayes' ? (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, alignItems: "start" }}>
          <LabeledSlider
            label={T.param_conflict}
            tooltip={T.tooltip_conflict}
            value={saneOpts.conflictPenalty}
            min={0} max={1} step={0.05}
            onChange={(_, v) => setOpts((prev: AlgoOptions) => ({...prev, conflictPenalty: v as number}))}
          />
          <LabeledSlider
            label={T.param_kappa}
            tooltip={T.tooltip_kappa}
            value={saneOpts.kappa}
            min={0} max={5} step={0.1}
            onChange={(_, v) => setOpts((prev: AlgoOptions) => ({...prev, kappa: v as number}))}
          />
          <LabeledSlider
            label={T.param_alpha}
            tooltip={T.tooltip_alpha}
            value={saneOpts.defaultAlphaFP}
            min={0} max={0.2} step={0.005}
            onChange={(_, v) => setOpts((prev: AlgoOptions) => ({ ...prev, defaultAlphaFP: v as number }))}
          />
          <LabeledSlider
            label={T.param_beta}
            tooltip={T.tooltip_beta}
            value={saneOpts.defaultBetaFN}
            min={0} max={0.2} step={0.005}
            onChange={(_, v) => setOpts((prev: AlgoOptions) => ({ ...prev, defaultBetaFN: v as number }))}
          />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
            {lang === 'ja' ? 'ヒューリスティックモードでは、矛盾ペナルティ（Strict/Lenient）のみが有効です。' : 'In heuristic mode, only the Conflict Penalty (Strict/Lenient) is active.'}
        </Typography>
      )}
    </Box>
  );
}