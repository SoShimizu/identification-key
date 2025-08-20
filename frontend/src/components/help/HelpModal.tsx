// frontend/src/components/help/HelpModal.tsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Typography
} from "@mui/material";
import { STR } from "../../i18n";


type Props = {
  open: boolean;
  onClose: () => void;
  lang: "ja" | "en";
};

export default function HelpModal({ open, onClose, lang }: Props) {
  const T = STR[lang].help;
  const [tab, setTab] = React.useState(0);

  const sections = [
    { key: "overview", text: T.overview },
    { key: "bayes",    text: T.bayes },
    { key: "heuristic",text: T.heuristic },
    { key: "interpret",text: T.interpret },
    { key: "tips",     text: T.tips }
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{T.title}</DialogTitle>
      <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons>
        {sections.map((s,i)=><Tab key={s.key} label={T.tabs[s.key as keyof typeof T.tabs]} value={i}/>)}
      </Tabs>
      <DialogContent dividers>
        <Box sx={{ whiteSpace: "pre-wrap" }}>
          <Typography variant="body2">{sections[tab].text}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">OK</Button>
      </DialogActions>
    </Dialog>
  );
}