// frontend/src/components/header/Ribbon.tsx
import React, { useMemo, useState } from "react";
import {
  AppBar, Toolbar, Tabs, Tab, Box, Stack, Typography,
  Select, MenuItem, FormControl, InputLabel, Switch, Divider,
  Button, ButtonGroup, FormControlLabel, IconButton, Tooltip, Chip, Collapse
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BugReportIcon from "@mui/icons-material/BugReport";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SettingsIcon from '@mui/icons-material/Settings';

import RibbonAlgoTab from "./RibbonAlgoTab";
import { applyFilters } from "../../utils/applyFilters";

import type { LayoutState, PanelKey } from "../../App";

type KeyInfoLike = { name: string; path?: string };

const PANEL_LABEL: Record<PanelKey, string> = {
  candidates: "候補タクサ",
  traits_unselected: "未選択の形質",
  traits_selected: "選択済みの形質",
  history: "選択履歴",
};

export type RibbonProps = {
  lang?: "ja" | "en";
  setLang?: React.Dispatch<React.SetStateAction<"ja" | "en">>;
  keys?: KeyInfoLike[];
  activeKey?: string;
  onPickKey?: (name: string) => Promise<void>;
  onRefreshKeys?: () => Promise<void>;
  mode?: "lenient" | "strict";
  setMode?: React.Dispatch<React.SetStateAction<"lenient" | "strict">>;
  algo?: "bayes" | "heuristic";
  setAlgo?: React.Dispatch<React.SetStateAction<"bayes" | "heuristic">>;
  onHelp?: () => void;
  themeMode?: "dark" | "light";
  setThemeMode?: (m: "dark" | "light") => void;
  layout?: LayoutState;
  onLayoutChange?: (v: LayoutState) => void;
  showMatchSupport?: boolean;
  setShowMatchSupport?: (b: boolean) => void;
  matrixName: string;
  selected: Record<string, number>;
  onApplied?: (res: any) => void;
};

type TabKey = "overview" | "algo" | "view";

export default function Ribbon(props: RibbonProps) {
  const {
    lang = "ja", setLang,
    keys, activeKey, onPickKey, onRefreshKeys,
    mode: modeProp, setMode,
    algo: algoProp, setAlgo,
    onHelp,
    themeMode = "dark", setThemeMode,
    layout, onLayoutChange,
    showMatchSupport = false, setShowMatchSupport,
    matrixName, selected, onApplied,
  } = props;

  const [tab, setTab] = useState<TabKey | null>(null);
  const [localAlgo, setLocalAlgo] = useState<"bayes" | "heuristic">(algoProp ?? "bayes");
  const [localMode, setLocalMode] = useState<"lenient" | "strict">(modeProp ?? "lenient");
  
  React.useEffect(() => { if (algoProp !== undefined) setLocalAlgo(algoProp); }, [algoProp]);
  React.useEffect(() => { if (modeProp !== undefined) setLocalMode(modeProp); }, [modeProp]);

  const selectedCount = useMemo(() => {
    if (!selected) return 0;
    return Object.values(selected).filter(v => v !== 0 && v !== undefined && v !== null).length;
  }, [selected]);
  
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastReq, setLastReq] = useState<any | null>(null);
  const [lastRes, setLastRes] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const runDiagnostic = async (payload: { selected: Record<string, number>; mode: "strict" | "lenient"; algorithm: "bayes" | "heuristic"; }) => {
    setBusy(true);
    setLastReq(payload);
    try {
      const res = await applyFilters(payload.selected, payload.mode, payload.algorithm, {
        defaultAlphaFP: 0.03, defaultBetaFN: 0.07, gammaNAPenalty: 0.95,
        kappa: 1.0, epsilonCut: 1e-6, useHardContradiction: true, wantInfoGain: false,
      });
      setLastRes(res);
      props.onApplied?.(res);
      console.debug("[A2] applyFilters response", res);
    } catch (e) {
      console.error("[A2] applyFilters error", e);
      setLastRes({ error: String(e) });
    } finally {
      setBusy(false);
      if (!debugOpen) setDebugOpen(true);
    }
  };

  const copyJson = (obj: any) => navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).catch(() => {});

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
        <Typography variant="h6" sx={{ mr: 2, fontWeight: "bold" }}>MorphoKey</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="primary" sx={{ minHeight: 48 }}>
          <Tab onMouseEnter={() => setTab("overview")} icon={<InfoOutlinedIcon />} iconPosition="start" label="概要" value="overview" />
          <Tab onMouseEnter={() => setTab("algo")} icon={<TuneIcon />} iconPosition="start" label="アルゴリズム" value="algo" />
          <Tab onMouseEnter={() => setTab("view")} icon={<SettingsIcon />} iconPosition="start" label="表示設定" value="view" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="ヘルプ">
            <IconButton onClick={onHelp}><HelpOutlineIcon /></IconButton>
        </Tooltip>
        <Tooltip title={themeMode === 'dark' ? "ライトモードに切り替え" : "ダークモードに切り替え"}>
            <Switch checked={themeMode === 'dark'} onChange={(e) => setThemeMode?.(e.target.checked ? 'dark' : 'light')} />
        </Tooltip>
      </Toolbar>

      <Collapse in={tab !== null}>
        <Box sx={{ px: 2, py: 2, borderTop: (t) => `1px solid ${t.palette.divider}`, bgcolor: 'background.default' }}>
          {tab === "overview" && (
            <Stack spacing={2}>
               <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">マトリクス: <b>{matrixName || "(未選択)"}</b></Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`選択数: ${selectedCount}`} variant="outlined" />
                  {onPickKey && (
                    <FormControl size="small" sx={{ minWidth: 240 }}>
                      <InputLabel>マトリクス切替</InputLabel>
                      <Select label="マトリクス切替" value={activeKey || ""} onChange={(e) => onPickKey(String(e.target.value))}>
                        {(keys || []).map((k) => <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                  {onRefreshKeys && <Tooltip title="一覧を再取得"><IconButton size="small" onClick={onRefreshKeys}><RefreshIcon /></IconButton></Tooltip>}
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                「アルゴリズム」タブから評価方法やパラメータを調整できます。設定はマトリクスごとに自動保存されます。
              </Typography>
               <Button size="small" variant={debugOpen ? "contained" : "outlined"} color="secondary" startIcon={<BugReportIcon />} onClick={() => setDebugOpen(v => !v)} sx={{ alignSelf: 'flex-start' }}>
                診断パネル
              </Button>
              <Collapse in={debugOpen}>
                <Box sx={{ p: 2, bgcolor: "background.paper", border: (t)=>`1px solid ${t.palette.divider}`, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">A2 診断ツール</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button size="small" variant="outlined" disabled={busy} onClick={() => runDiagnostic({ selected, mode: localMode, algorithm: localAlgo })}>現在の選択で実行</Button>
                      <Button size="small" variant="outlined" disabled={busy} onClick={() => runDiagnostic({ selected: {}, mode: "strict", algorithm: "bayes" })}>空選択 (Bayes/strict)</Button>
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box sx={{ flex: 1, width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">リクエスト</Typography>
                        <Box component="pre" sx={{ m: 0, p: 1, bgcolor: 'action.hover', borderRadius: 1, maxHeight: 120, overflow: "auto", fontSize: '0.75rem' }}>{JSON.stringify(lastReq, null, 2)}</Box>
                        <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyJson(lastReq)} sx={{ mt: 0.5 }}>コピー</Button>
                      </Box>
                      <Box sx={{ flex: 1, width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">レスポンス</Typography>
                        <Box component="pre" sx={{ m: 0, p: 1, bgcolor: 'action.hover', borderRadius: 1, maxHeight: 120, overflow: "auto", fontSize: '0.75rem' }}>{JSON.stringify(lastRes, null, 2)}</Box>
                        <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyJson(lastRes)} sx={{ mt: 0.5 }}>コピー</Button>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Collapse>
            </Stack>
          )}
          {tab === "algo" && <RibbonAlgoTab matrixName={matrixName} selected={selected} onApplied={onApplied} defaultAlgorithm={localAlgo} defaultMode={localMode} />}
          {tab === "view" && (
            <Stack spacing={2} divider={<Divider flexItem />}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>パネルレイアウト</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(["tl", "tr", "bl", "br"] as (keyof LayoutState)[]).map((k, i) => (
                    <FormControl key={k} size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>{["左上", "右上", "左下", "右下"][i]}</InputLabel>
                      <Select label={["左上", "右上", "左下", "右下"][i]} value={layout?.[k] || ""} onChange={(e) => onLayoutChange?.({ ...layout!, [k]: e.target.value as PanelKey })}>
                        {(Object.keys(PANEL_LABEL) as PanelKey[]).map((pk) => <MenuItem key={pk} value={pk}>{PANEL_LABEL[pk]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </Box>
              <Box>
                 <Typography variant="subtitle2" gutterBottom>表示オプション</Typography>
                <FormControlLabel control={<Switch checked={showMatchSupport} onChange={(e) => setShowMatchSupport?.(e.target.checked)} />} label="Match/Support 列を表示" />
                {setLang && (
                    <FormControl size="small" sx={{ minWidth: 140, ml: 2 }}>
                        <InputLabel>言語</InputLabel>
                        <Select label="言語" value={lang} onChange={(e) => setLang(e.target.value as "ja" | "en")}>
                        <MenuItem value="ja">日本語</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                        </Select>
                    </FormControl>
                )}
              </Box>
            </Stack>
          )}
        </Box>
      </Collapse>
    </AppBar>
  );
}