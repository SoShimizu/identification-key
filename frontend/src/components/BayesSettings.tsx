// frontend/src/components/BayesSettings.tsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, Button, TextField, Stack, Typography
} from "@mui/material";
import { AlgoOptions, clampAlgoOptions } from "../hooks/useAlgoOpts";

type Props = {
  open: boolean;
  onClose: () => void;
  value: AlgoOptions;
  onChange: (next: AlgoOptions) => void;
  onApply?: () => void; // call backend apply if needed
};

export default function BayesSettings(props: Props) {
  const { open, onClose, value, onChange, onApply } = props;

  const handleNum = (key: keyof AlgoOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) {
      onChange({ ...value, [key]: v });
    }
  };

  const handleBool = (key: keyof AlgoOptions) => (_: any, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  const apply = () => {
    onChange(clampAlgoOptions(value));
    onApply?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bayes パラメータ</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2">
            矛盾除外・NAペナルティ・平滑化を含むA2の調整。値はマトリクス毎に保存されます。
          </Typography>

          <TextField
            label="α (偽陽性, 0–0.2)"
            type="number" inputProps={{ step: 0.005, min: 0, max: 0.2 }}
            value={value.defaultAlphaFP} onChange={handleNum("defaultAlphaFP")}
          />
          <TextField
            label="β (偽陰性, 0–0.2)"
            type="number" inputProps={{ step: 0.005, min: 0, max: 0.2 }}
            value={value.defaultBetaFN} onChange={handleNum("defaultBetaFN")}
          />
          <TextField
            label="γ (NAペナルティ, 0.8–1.0)"
            type="number" inputProps={{ step: 0.01, min: 0.8, max: 1.0 }}
            value={value.gammaNAPenalty} onChange={handleNum("gammaNAPenalty")}
          />
          <TextField
            label="κ (事後の平滑化, 0–5)"
            type="number" inputProps={{ step: 0.1, min: 0, max: 5 }}
            value={value.kappa} onChange={handleNum("kappa")}
          />
          <TextField
            label="ε (小値丸め, 1e-12–1e-3)"
            type="number" inputProps={{ step: "any", min: 1e-12, max: 1e-3 }}
            value={value.epsilonCut} onChange={handleNum("epsilonCut")}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={value.useHardContradiction}
                onChange={handleBool("useHardContradiction")}
              />
            }
            label="ハード矛盾除外（strict時）"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={apply}>適用</Button>
      </DialogActions>
    </Dialog>
  );
}
