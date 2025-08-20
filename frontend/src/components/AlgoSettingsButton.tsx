// frontend/src/components/AlgoSettingsButton.tsx
import React, { useState } from "react";
import { Fab } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import BayesSettings from "./BayesSettings";
import { useAlgoOpts } from "../hooks/useAlgoOpts";

type Props = {
  matrixName: string;
  onApply?: (opts: any) => void; // call Wails backend with opts object
};

export default function AlgoSettingsButton({ matrixName, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const { opts, setOpts } = useAlgoOpts(matrixName);

  return (
    <>
      <Fab
        color="primary"
        aria-label="settings"
        onClick={() => setOpen(true)}
        style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1000 }}
      >
        <TuneIcon />
      </Fab>
      <BayesSettings
        open={open}
        onClose={() => setOpen(false)}
        value={opts}
        onChange={setOpts}
        onApply={() => onApply?.(opts)}
      />
    </>
  );
}
