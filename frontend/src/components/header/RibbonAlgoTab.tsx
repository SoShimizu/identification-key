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
  onAlgorithmChange: (algo: "bayes" | "heuristic") => void;
  mode?: "strict" | "lenient";
  onModeChange: (mode: "strict" | "lenient") => void;
  autoApply?: boolean;
  debounceMs?: number;
  lang: "ja" | "en";
};

export default function RibbonAlgoTab(props: Props) {
  const {
    matrixName, selected, onApplied, lang,
    algorithm = "bayes", onAlgorithmChange,
    mode = "strict", onModeChange,
    autoApply = true, debounceMs = 300
  } = props;

  const T = STR[lang].algoTab;
  const { opts, setOpts, reset } = useAlgoOpts(matrixName);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState<boolean>(autoApply);

  const sane = useMemo(() => clampAlgoOptions(opts), [opts]);

  const doApply = async () => {
    setBusy(true);
    try {
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
    timer.current = window.setTimeout(() => { void doApply(); }, debounceMs);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, debounceMs, sane, mode, algorithm, selected]);

  const onNum = (k: keyof typeof sane) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) setOpts({ ...opts, [k]: v } as any);
  };
  const onCheck = (k: keyof typeof sane) => (_: any, checked: boolean) => {
    setOpts({ ...opts, [k]: checked } as any);
  };

  const labelSx = { display:"flex", alignItems:"center", gap:0.5 };

  return (
    <Box>
      <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{T.algorithm}</InputLabel>
          <Select label={T.algorithm} value={algorithm} onChange={(e: SelectChangeEvent) => onAlgorithmChange(e.target.value as any)}>
            <MenuItem value="bayes">Bayes (A2)</MenuItem>
            <MenuItem value="heuristic">Heuristic</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>{T.mode}</InputLabel>
          <Select label={T.mode} value={mode} onChange={(e: SelectChangeEvent) => onModeChange(e.target.value as any)}>
            <MenuItem value="strict">{T.mode_strict}</MenuItem>
            <MenuItem value="lenient">{T.mode_lenient}</MenuItem>
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
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }, alignItems: "start" }}>
          {/* Bayes-specific parameters */}
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_alpha}</Typography><Tooltip title={T.tooltip_alpha}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={0.2} step={0.005} value={sane.defaultAlphaFP} onChange={(_, v) => setOpts({ ...opts, defaultAlphaFP: v as number })} />
              <TextField size="small" type="number" value={sane.defaultAlphaFP} onChange={onNum("defaultAlphaFP")} inputProps={{ step: 0.005, min: 0, max: 0.2 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_beta}</Typography><Tooltip title={T.tooltip_beta}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={0.2} step={0.005} value={sane.defaultBetaFN} onChange={(_, v) => setOpts({ ...opts, defaultBetaFN: v as number })} />
              <TextField size="small" type="number" value={sane.defaultBetaFN} onChange={onNum("defaultBetaFN")} inputProps={{ step: 0.005, min: 0, max: 0.2 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_gamma}</Typography><Tooltip title={T.tooltip_gamma}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0.8} max={1.0} step={0.01} value={sane.gammaNAPenalty} onChange={(_, v) => setOpts({ ...opts, gammaNAPenalty: v as number })} />
              <TextField size="small" type="number" value={sane.gammaNAPenalty} onChange={onNum("gammaNAPenalty")} inputProps={{ step: 0.01, min: 0.8, max: 1.0 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_kappa}</Typography><Tooltip title={T.tooltip_kappa}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <Slider min={0} max={5} step={0.1} value={sane.kappa} onChange={(_, v) => setOpts({ ...opts, kappa: v as number })} />
              <TextField size="small" type="number" value={sane.kappa} onChange={onNum("kappa")} inputProps={{ step: 0.1, min: 0, max: 5 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_epsilon}</Typography><Tooltip title={T.tooltip_epsilon}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <TextField size="small" type="number" value={sane.epsilonCut} onChange={onNum("epsilonCut")} inputProps={{ step: "any", min: 1e-12, max: 1e-3 }} />
            </Stack>
          </Box>
          <Box>
            <Stack spacing={1}>
              <Box sx={labelSx}><Typography variant="body2">{T.param_hard_contradiction}</Typography><Tooltip title={T.tooltip_hard_contradiction}><InfoOutlinedIcon fontSize="small" /></Tooltip></Box>
              <FormControlLabel control={<Switch checked={sane.useHardContradiction} onChange={onCheck("useHardContradiction")} />} label={sane.useHardContradiction ? "有効" : "無効"} />
            </Stack>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
            ヒューリスティックモードには、現在調整可能なパラメータはありません。
        </Typography>
      )}
    </Box>
  );
}