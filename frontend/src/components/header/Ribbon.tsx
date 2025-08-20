// frontend/src/components/header/Ribbon.tsx
import React, { useState } from "react";
import {
  AppBar, Box, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Switch, Tab, Tabs, Toolbar, Tooltip, Typography
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from '@mui/icons-material/Settings';
import TranslateIcon from '@mui/icons-material/Translate';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import RibbonAlgoTab from "./RibbonAlgoTab";
import RibbonOverviewTab from "./RibbonOverviewTab";
import RibbonViewTab from "./RibbonViewTab";
import RibbonManualTab from "./RibbonManualTab";
import { STR } from "../../i18n";

type KeyInfoLike = { name: string; path?: string };

export type RibbonProps = {
  lang: "ja" | "en";
  setLang: React.Dispatch<React.SetStateAction<"ja" | "en">>;
  keys?: KeyInfoLike[];
  activeKey?: string;
  onPickKey: (name: string) => Promise<void>;
  onRefreshKeys: () => Promise<void>;
  mode: "lenient" | "strict";
  setMode: (mode: "lenient" | "strict") => void;
  algo: "bayes" | "heuristic";
  setAlgo: React.Dispatch<React.SetStateAction<"bayes" | "heuristic">>;
  onHelp: () => void;
  themeMode: "dark" | "light";
  setThemeMode: (m: "dark" | "light") => void;
  showMatchSupport: boolean;
  setShowMatchSupport: (b: boolean) => void;
  matrixName: string;
  selected: Record<string, number>;
  onApplied?: (res: any) => void;
};

type TabKey = "overview" | "algo" | "view" | "manual";

export default function Ribbon(props: RibbonProps) {
  const {
    lang, setLang,
    keys, activeKey, onPickKey, onRefreshKeys,
    mode, setMode,
    algo, setAlgo,
    onHelp,
    themeMode, setThemeMode,
    showMatchSupport, setShowMatchSupport,
    matrixName, selected, onApplied,
  } = props;

  const T = STR[lang];
  
  const [tab, setTab] = useState<TabKey | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            zIndex: 1201,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'
        }}
        onMouseLeave={() => setTab(null)}
    >
      <Toolbar sx={{ px: 2, minHeight: 48, gap: 2 }}>
        <Typography variant="h6" sx={{ mr: 2, fontWeight: "bold" }}>{T.appTitle}</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="primary" sx={{ minHeight: 48 }}>
          <Tab onMouseEnter={() => setTab("overview")} icon={<InfoOutlinedIcon />} iconPosition="start" label={T.ribbon.overview} value="overview" />
          <Tab onMouseEnter={() => setTab("algo")} icon={<TuneIcon />} iconPosition="start" label={T.ribbon.algorithm} value="algo" />
          <Tab onMouseEnter={() => setTab("view")} icon={<SettingsIcon />} iconPosition="start" label={T.ribbon.viewSettings} value="view" />
          <Tab onMouseEnter={() => setTab("manual")} icon={<MenuBookIcon />} iconPosition="start" label={T.ribbon.manual} value="manual" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        {onPickKey && (
          <FormControl size="small" sx={{ minWidth: 240, mr: 1 }}>
            <InputLabel>{T.ribbon.switchMatrix}</InputLabel>
            <Select label={T.ribbon.switchMatrix} value={activeKey || ""} onChange={(e) => onPickKey(String(e.target.value))}>
              {(keys || []).map((k) => <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        {setLang && (
            <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
                <InputLabel>Language</InputLabel>
                <Select label="Language" value={lang} onChange={(e) => setLang(e.target.value as "ja" | "en")} startAdornment={<TranslateIcon fontSize="small" sx={{mr: 1, color: 'action.active'}}/>}>
                <MenuItem value="ja">日本語</MenuItem>
                <MenuItem value="en">English</MenuItem>
                </Select>
            </FormControl>
        )}
        <Tooltip title={T.ribbon.switchTheme}>
            <Switch checked={themeMode === 'dark'} onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')} />
        </Tooltip>
        <Tooltip title={T.ribbon.help}>
            <IconButton onClick={onHelp}><HelpOutlineIcon /></IconButton>
        </Tooltip>
      </Toolbar>

      <Collapse in={tab !== null}>
        <Box sx={{ px: 2, py: 2, borderTop: (t) => `1px solid ${t.palette.divider}`, bgcolor: 'background.default' }}>
          {tab === "overview" && <RibbonOverviewTab lang={lang} matrixName={matrixName} selected={selected} debugOpen={debugOpen} setDebugOpen={setDebugOpen} />}
          {tab === "algo" && <RibbonAlgoTab lang={lang} matrixName={matrixName} selected={selected} onApplied={onApplied} algorithm={algo} onAlgorithmChange={setAlgo} mode={mode} onModeChange={setMode} />}
          {tab === "view" && <RibbonViewTab lang={lang} showMatchSupport={showMatchSupport} setShowMatchSupport={setShowMatchSupport} />}
          {tab === "manual" && <RibbonManualTab lang={lang} />}
        </Box>
      </Collapse>
    </AppBar>
  );
}