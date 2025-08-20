// frontend/src/components/header/RibbonViewTab.tsx
import React from "react";
import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  Typography
} from "@mui/material";
import { STR } from "../../i18n";

type Props = {
  lang: "ja" | "en";
  showMatchSupport: boolean;
  setShowMatchSupport: (b: boolean) => void;
};

export default function RibbonViewTab({ lang, showMatchSupport, setShowMatchSupport }: Props) {
  const T = STR[lang];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>表示オプション</Typography>
        <FormControlLabel
          control={<Switch checked={showMatchSupport} onChange={(e) => setShowMatchSupport(e.target.checked)} />}
          label="候補タクサに Match/Support 列を表示"
        />
      </Box>
    </Stack>
  );
}