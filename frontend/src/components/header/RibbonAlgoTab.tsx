// frontend/src/components/header/RibbonAlgoTab.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Button, Divider, FormControl, FormControlLabel, InputLabel,
  MenuItem, Select, SelectChangeEvent, Slider, Stack, Switch, TextField, Tooltip, Typography
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { clampAlgoOptions, useAlgoOpts } from "../../hooks/useAlgoOpts";
import { applyFilters } from "../../utils/applyFilters";
import { STR } from "../../i18n";

export type SelectionMap = Record<string, number>;

type Props = {
  matrixName: string;
  selected: SelectionMap;
  onApplied?: (res: any) => void;
  algorithm?: "bayes" | "heuristic";
  onAlgorithmChange?: (algo: "bayes" | "heuristic") => void;
  lang: "ja" | "en";
};

export default function RibbonAlgoTab(props: Props) {
  const {
    matrixName, selected, onApplied, lang,
    algorithm = "bayes", onAlgorithmChange,
  } = props;

  const T = STR[lang].algoTab;
  const { opts, setOpts, reset } = useAlgoOpts(matrixName);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState<boolean>(true);

  const sane = useMemo(() => clampAlgoOptions(opts), [opts]);

  const doApply = async () => {
    setBusy(true);
    try {
      // Pass "strict" or "lenient" based on penalty, for heuristic compatibility
      const mode = opts.conflictPenalty > 0.5 ? "strict" : "lenient";
      const res = await applyFilters(selected, mode, algorithm, sane);
      onApplied?.(res);
    } finally {
      setBusy(false);
    }
  };

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!auto) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void doApply(); }, 300);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [auto, sane, algorithm, selected]);

  const onNum = (k: keyof typeof sane) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) setOpts({ ...opts, [k]: v } as any);
  };
  
  const labelSx = { display:"flex", alignItems:"center", gap:0.5 };

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
        <FormControlLabel control={<Switch checked={auto} onChange={(_,c)=>setAuto(c)} />} label={T.auto_apply} />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={doApply} disabled={busy || auto}>{T.manual_apply}</Button>
          <Button variant="text" onClick={reset} disabled={busy}>{T.reset_defaults}</Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {algorithm === 'bayes' ? (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, alignItems: "start" }}>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">矛盾ペナルティ</Typography><Tooltip title="矛盾に対するペナルティの強さを調整します。0は寛容、1は厳格です。"><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={1} step={0.05} value={sane.conflictPenalty} onChange={(_, v) => setOpts({ ...opts, conflictPenalty: v as number })} />
              <TextField size="small" type="number" value={sane.conflictPenalty} onChange={onNum("conflictPenalty")} inputProps={{ step: 0.05, min: 0, max: 1 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_alpha}</Typography><Tooltip title={T.tooltip_alpha}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={0.2} step={0.005} value={sane.defaultAlphaFP} onChange={(_, v) => setOpts({ ...opts, defaultAlphaFP: v as number })} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_beta}</Typography><Tooltip title={T.tooltip_beta}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={0.2} step={0.005} value={sane.defaultBetaFN} onChange={(_, v) => setOpts({ ...opts, defaultBetaFN: v as number })} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_kappa}</Typography><Tooltip title={T.tooltip_kappa}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={5} step={0.1} value={sane.kappa} onChange={(_, v) => setOpts({ ...opts, kappa: v as number })} />
            </Stack>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
            ヒューリスティックモードには、調整可能なパラメータはありません。
        </Typography>
      )}
    </Box>
  );
}