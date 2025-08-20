// frontend/src/components/HelpButton.tsx
import React from "react";
import {
  IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Box
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

type Props = {
  title: string;
  tooltip?: string;
  children: React.ReactNode | string; // モーダル本文
  size?: "small" | "medium";
};

export default function HelpButton({ title, tooltip = "Help", children, size = "small" }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size={size} onClick={() => setOpen(true)} aria-label="help">
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ whiteSpace: "pre-wrap" }}>{children}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
