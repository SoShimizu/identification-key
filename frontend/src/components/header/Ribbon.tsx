// frontend/src/components/header/Ribbon.tsx
import React, { useState } from "react";
import {
  AppBar, Box, Collapse, FormControl, InputLabel, MenuItem, Select, Tab, Tabs, Toolbar, Tooltip, Typography, Switch, SelectChangeEvent, Theme, IconButton, Button, Divider
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import TranslateIcon from '@mui/icons-material/Translate';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';

import RibbonWelcomeTab from "./RibbonWelcomeTab";
import ReportDialog from "./ReportDialog";
import { STR } from "../../i18n";
import { AlgoOptions } from "../../hooks/useAlgoOpts";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { HistoryItem, TaxonScore, MatrixInfo } from "../../api";
import RibbonSettingsTab from "./RibbonSettingsTab";

type KeyInfoLike = { name: string; path?: string };

export type RibbonProps = {
  lang: "ja" | "en";
  setLang: React.Dispatch<React.SetStateAction<"ja" | "en">>;
  keys?: KeyInfoLike[];
  activeKey?: string;
  onPickKey: (name: string) => Promise<void>;
  onRefreshKeys: () => Promise<void>;
  algo: "bayes" | "heuristic";
  setAlgo: React.Dispatch<React.SetStateAction<"bayes" | "heuristic">>;
  themeMode: "dark" | "light";
  setThemeMode: (m: "dark" | "light") => void;
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  matrixInfo: MatrixInfo | null;
  matrixName: string;
  history: HistoryItem[];
  scores: TaxonScore[];
};

type TabKey = "welcome" | "settings";

export default function Ribbon(props: RibbonProps) {
  const { lang, setLang, keys, activeKey, onPickKey, algo, setAlgo, themeMode, setThemeMode, opts, setOpts, matrixInfo, matrixName, history, scores } = props;
  const T = STR[lang];
  const [tab, setTab] = useState<TabKey | false>(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const displayMatrixTitle = matrixInfo ? (lang === 'ja' ? matrixInfo.title_jp || matrixInfo.title_en : matrixInfo.title_en || matrixInfo.title_jp) : matrixName;

  return (
    <>
      <AppBar
        position="relative"
        color="default"
        elevation={0}
        sx={{ zIndex: (theme: Theme) => theme.zIndex.drawer + 1 }}
    >
        <Toolbar sx={{ px: 2, minHeight: 48, gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 2, fontWeight: "bold", cursor: 'pointer' }} onClick={() => BrowserOpenURL("https://github.com/soshimizu/identification-key")}>
              MyKeyLogue
          </Typography>

          <Tabs value={tab} onChange={(_, v: TabKey | false) => setTab(v)} onMouseLeave={() => setTab(false)} textColor="inherit" indicatorColor="primary" sx={{ minHeight: 48 }}>
            <Tab onMouseEnter={() => setTab("welcome")} icon={<HomeIcon />} iconPosition="start" label={T.ribbon.welcome} value="welcome" />
            <Tab onMouseEnter={() => setTab("settings")} icon={<SettingsIcon />} iconPosition="start" label={T.ribbon.settings} value="settings" />
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <FormControl size="small" sx={{ minWidth: 240, mr: 1 }}>
            <InputLabel>{T.ribbon.switchMatrix}</InputLabel>
            <Select label={T.ribbon.switchMatrix} value={activeKey || ""} onChange={(e: SelectChangeEvent<string>) => onPickKey(String(e.target.value))}>
              {(keys || []).map((k) => <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>)}
            </Select>
          </FormControl>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Export Identification Report">
              <span>
                  <Button variant="outlined" size="small" startIcon={<AssessmentIcon />} onClick={() => setReportDialogOpen(true)} disabled={history.length === 0}>
                      Report
                  </Button>
              </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem />
          
          <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
              <InputLabel>Language</InputLabel>
              <Select label="Language" value={lang} onChange={(e: SelectChangeEvent<"ja" | "en">) => setLang(e.target.value as "ja" | "en")} startAdornment={<TranslateIcon fontSize="small" sx={{mr: 1, color: 'action.active'}}/>}>
              <MenuItem value="ja">日本語</MenuItem>
              <MenuItem value="en">English</MenuItem>
              </Select>
          </FormControl>

          <Tooltip title={T.ribbon.switchTheme}>
              <Switch checked={themeMode === 'dark'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThemeMode(e.target.checked ? 'dark' : 'light')} />
          </Tooltip>
        </Toolbar>

        <Collapse in={tab !== false} sx={{ transitionDuration: '800ms' }}>
          <Box
              onMouseEnter={() => setTab(tab)} onMouseLeave={() => setTab(false)}
              sx={{
                  position: 'absolute', left: 0, right: 0, px: 2, py: 2,
                  bgcolor: 'background.default',
                  boxShadow: '0px 4px 12px -2px rgba(0,0,0,0.1)',
                  borderBottom: 1,
                  borderBottomColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300',
              }}
          >
            <IconButton onClick={() => setTab(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <CloseIcon />
            </IconButton>
            {tab === "welcome" && <RibbonWelcomeTab lang={lang} />}
            {tab === "settings" && <RibbonSettingsTab lang={lang} matrixName={matrixName} algorithm={algo} onAlgorithmChange={setAlgo} opts={opts} setOpts={setOpts} />}
          </Box>
        </Collapse>
      </AppBar>
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        currentLang={lang}
        {...props}
      />
    </>
  );
}