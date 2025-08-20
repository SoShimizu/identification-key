// frontend/src/components/header/RibbonViewTab.tsx
import React from "react";
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography
} from "@mui/material";
import { STR } from "../../i18n";
import type { LayoutState, PanelKey } from "../../App";

type Props = {
  lang: "ja" | "en";
  layout: LayoutState;
  onLayoutChange: (v: LayoutState) => void;
  showMatchSupport: boolean;
  setShowMatchSupport: (b: boolean) => void;
};

export default function RibbonViewTab({ lang, layout, onLayoutChange, showMatchSupport, setShowMatchSupport }: Props) {
  const T = STR[lang];
  const PANEL_LABEL: Record<PanelKey, string> = T.panels;

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>パネルレイアウト</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(["tl", "tr", "bl", "br"] as (keyof LayoutState)[]).map((k, i) => (
            <FormControl key={k} size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{["左上", "右上", "左下", "右下"][i]}</InputLabel>
              <Select
                label={["左上", "右上", "左下", "右下"][i]}
                value={layout?.[k] || ""}
                onChange={(e) => onLayoutChange({ ...layout!, [k]: e.target.value as PanelKey })}
              >
                {(Object.keys(PANEL_LABEL) as PanelKey[]).map((pk) => <MenuItem key={pk} value={pk}>{PANEL_LABEL[pk]}</MenuItem>)}
              </Select>
            </FormControl>
          ))}
        </Stack>
      </Box>
      <Box>
        <Typography variant="subtitle2" gutterBottom>表示オプション</Typography>
        <FormControlLabel
          control={<Switch checked={showMatchSupport} onChange={(e) => setShowMatchSupport(e.target.checked)} />}
          label="Match/Support 列を表示"
        />
      </Box>
    </Stack>
  );
}