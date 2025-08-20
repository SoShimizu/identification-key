// frontend/src/components/RibbonAlgoTab.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Button, Divider, FormControl, FormControlLabel, InputLabel,
  MenuItem, Select, SelectChangeEvent, Slider, Stack, Switch, TextField, Tooltip, Typography
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { clampAlgoOptions, useAlgoOpts } from "../../hooks/useAlgoOpts";
import { applyFilters } from "../../utils/applyFilters";

export type SelectionMap = Record<string, number>; // 形質ID -> -1/0/1 等（既存仕様に合わせて）

type Props = {
  matrixName: string;                 // 現在のマトリクス名（保存キーに使用）
  selected: SelectionMap;             // 現在の選択
  onApplied?: (res: any) => void;     // Apply 後に結果（Scores/Suggestions 等）を親へ通知
  defaultAlgorithm?: "bayes" | "heuristic";
  defaultMode?: "strict" | "lenient";
  autoApply?: boolean;                // 入力のたび自動適用（既定 true）
  debounceMs?: number;                // 自動適用の遅延（既定 300ms）
};

export default function RibbonAlgoTab(props: Props) {
  const {
    matrixName,
    selected,
    onApplied,
    defaultAlgorithm = "bayes",
    defaultMode = "strict",
    autoApply = true,
    debounceMs = 300
  } = props;

  const { opts, setOpts, reset } = useAlgoOpts(matrixName);
  const [algorithm, setAlgorithm] = useState<"bayes"|"heuristic">(defaultAlgorithm);
  const [mode, setMode] = useState<"strict"|"lenient">(defaultMode);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState<boolean>(autoApply);

  // 入力値のクレンジング
  const sane = useMemo(() => clampAlgoOptions(opts), [opts]);

  // 適用処理
  const doApply = async () => {
    setBusy(true);
    try {
      const res = await applyFilters(selected, mode, algorithm, sane);
      onApplied?.(res);
    } finally {
      setBusy(false);
    }
  };

  // 自動適用（パラメータ・モード・アルゴ・選択の変化を監視）
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
    <Box p={2}>
      {/* 上部コントロール行 */}
      <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="algo-label">アルゴリズム</InputLabel>
          <Select
            labelId="algo-label" label="アルゴリズム"
            value={algorithm}
            onChange={(e: SelectChangeEvent) => setAlgorithm(e.target.value as any)}
          >
            <MenuItem value="bayes">Bayes（A2）</MenuItem>
            <MenuItem value="heuristic">Heuristic</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="mode-label">モード</InputLabel>
          <Select
            labelId="mode-label" label="モード"
            value={mode}
            onChange={(e: SelectChangeEvent) => setMode(e.target.value as any)}
          >
            <MenuItem value="strict">strict（矛盾を厳格に扱う）</MenuItem>
            <MenuItem value="lenient">lenient（寛容）</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={auto} onChange={(_,c)=>setAuto(c)} />}
          label="自動適用"
        />

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={doApply} disabled={busy || auto}>
            手動適用
          </Button>
          <Button variant="text" onClick={reset} disabled={busy}>
            既定に戻す
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* ここから下は CSS Grid（MUI Grid は使用しない） */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
            lg: "1fr 1fr 1fr",
          },
          alignItems: "start",
        }}
      >
        {/* α */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">α（偽陽性）</Typography>
              <Tooltip title="truth=No を Yes と観測する誤り率。0〜0.2 推奨。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Slider
              min={0} max={0.2} step={0.005}
              value={sane.defaultAlphaFP}
              onChange={(_, v) => setOpts({ ...opts, defaultAlphaFP: v as number })}
              aria-label="alpha"
            />
            <TextField
              size="small" type="number" value={sane.defaultAlphaFP}
              onChange={onNum("defaultAlphaFP")}
              inputProps={{ step: 0.005, min: 0, max: 0.2 }}
            />
          </Stack>
        </Box>

        {/* β */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">β（偽陰性）</Typography>
              <Tooltip title="truth=Yes を No と観測する誤り率。0〜0.2 推奨。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Slider
              min={0} max={0.2} step={0.005}
              value={sane.defaultBetaFN}
              onChange={(_, v) => setOpts({ ...opts, defaultBetaFN: v as number })}
              aria-label="beta"
            />
            <TextField
              size="small" type="number" value={sane.defaultBetaFN}
              onChange={onNum("defaultBetaFN")}
              inputProps={{ step: 0.005, min: 0, max: 0.2 }}
            />
          </Stack>
        </Box>

        {/* γ */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">γ（NAペナルティ）</Typography>
              <Tooltip title="truth=NA で Yes/No を観測した場合の軽い減点。0.8〜1.0。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Slider
              min={0.8} max={1.0} step={0.01}
              value={sane.gammaNAPenalty}
              onChange={(_, v) => setOpts({ ...opts, gammaNAPenalty: v as number })}
              aria-label="gamma"
            />
            <TextField
              size="small" type="number" value={sane.gammaNAPenalty}
              onChange={onNum("gammaNAPenalty")}
              inputProps={{ step: 0.01, min: 0.8, max: 1.0 }}
            />
          </Stack>
        </Box>

        {/* κ */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">κ（平滑化）</Typography>
              <Tooltip title="事後分布の均し。過信抑制に有効。0〜5。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Slider
              min={0} max={5} step={0.1}
              value={sane.kappa}
              onChange={(_, v) => setOpts({ ...opts, kappa: v as number })}
              aria-label="kappa"
            />
            <TextField
              size="small" type="number" value={sane.kappa}
              onChange={onNum("kappa")}
              inputProps={{ step: 0.1, min: 0, max: 5 }}
            />
          </Stack>
        </Box>

        {/* ε */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">ε（丸め閾値）</Typography>
              <Tooltip title="極小確率を 0 に丸める数値安定化。1e-12〜1e-3。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <TextField
              size="small" type="number" value={sane.epsilonCut}
              onChange={onNum("epsilonCut")}
              inputProps={{ step: "any", min: 1e-12, max: 1e-3 }}
            />
          </Stack>
        </Box>

        {/* ハード矛盾 */}
        <Box>
          <Stack spacing={1}>
            <Box sx={labelSx}>
              <Typography variant="body2">ハード矛盾除外</Typography>
              <Tooltip title="strict時、明確な矛盾を即時除外します。">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={sane.useHardContradiction}
                  onChange={onCheck("useHardContradiction")}
                />
              }
              label={sane.useHardContradiction ? "有効" : "無効"}
            />
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary">
        変更は {auto ? "自動的に適用されます" : "「手動適用」ボタンで適用します"}。パラメータはマトリクス「{matrixName}」ごとに保存されます。
      </Typography>
    </Box>
  );
}
