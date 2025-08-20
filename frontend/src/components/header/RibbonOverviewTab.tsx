// frontend/src/components/header/RibbonOverviewTab.tsx
import React, { useMemo } from "react";
import {
  Stack,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import { STR } from "../../i18n";

type Props = {
  lang: "ja" | "en";
  matrixName: string;
  selected: Record<string, number>;
  debugOpen: boolean;
  setDebugOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function RibbonOverviewTab({ lang, matrixName, selected, debugOpen, setDebugOpen }: Props) {
  const T = STR[lang];

  const selectedCount = useMemo(() => {
    if (!selected) return 0;
    return Object.values(selected).filter(v => v !== 0 && v !== undefined && v !== null).length;
  }, [selected]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1">{T.ribbon.matrix}: <b>{matrixName || "(未選択)"}</b></Typography>
        <Chip size="small" label={`${T.ribbon.selectedCount}: ${selectedCount}`} variant="outlined" />
      </Stack>
      <Typography variant="body2" color="text.secondary">{T.ribbon.description}</Typography>
      <Button
        size="small"
        variant={debugOpen ? "contained" : "outlined"}
        color="secondary"
        startIcon={<BugReportIcon />}
        onClick={() => setDebugOpen(v => !v)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {T.ribbon.diagnosticPanel}
      </Button>
    </Stack>
  );
}