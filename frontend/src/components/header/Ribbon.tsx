// frontend/src/components/Ribbon.tsx
import React, { useMemo, useState } from "react";
import {
  AppBar, Toolbar, Tabs, Tab, Box, Stack, Typography,
  Select, MenuItem, FormControl, InputLabel, Switch, Divider,
  Button, ButtonGroup, TextField, FormControlLabel, IconButton, Tooltip, Chip, Collapse
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BugReportIcon from "@mui/icons-material/BugReport";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import RibbonAlgoTab from "./RibbonAlgoTab";
import { applyFilters } from "../../utils/applyFilters";

import type { LayoutState, PanelKey } from "../../App";

// KeysDropdown に依存しない“ゆるい”受け口
type KeyInfoLike = { name: string; path?: string };

const PANEL_LABEL: Record<PanelKey, string> = {
  candidates: "候補タクサ",
  traits_unselected: "未選択の形質",
  traits_selected: "選択済みの形質",
  history: "選択履歴",
};

export type RibbonProps = {
  // i18n
  lang?: "ja" | "en";
  setLang?: React.Dispatch<React.SetStateAction<"ja" | "en">>;

  // マトリクス選択
  keys?: KeyInfoLike[];
  activeKey?: string;
  onPickKey?: (name: string) => Promise<void>;
  onRefreshKeys?: () => Promise<void>;

  // A2 基本（モード/アルゴ）
  mode?: "lenient" | "strict";
  setMode?: React.Dispatch<React.SetStateAction<"lenient" | "strict">>;
  algo?: "bayes" | "heuristic";
  setAlgo?: React.Dispatch<React.SetStateAction<"bayes" | "heuristic">>;

  // 通知など
  onHelp?: () => void;

  // ビジュアル
  themeMode?: "dark" | "light";
  setThemeMode?: (m: "dark" | "light") => void;

  // レイアウト（任意）
  layout?: LayoutState;
  onLayoutChange?: (v: LayoutState) => void;

  // 表示列トグル（任意）
  showMatchSupport?: boolean;
  setShowMatchSupport?: (b: boolean) => void;

  // A2 実行ハンドル
  matrixName: string;
  selected: Record<string, number>;
  onApplied?: (res: any) => void; // scores/suggestions を親へ
};

type TabKey = "overview" | "algo" | "view" | "help";

export default function Ribbon(props: RibbonProps) {
  const {
    // i18n
    lang = "ja",
    setLang,
    // keys
    keys,
    activeKey,
    onPickKey,
    onRefreshKeys,
    // a2 basics
    mode: modeProp,
    setMode,
    algo: algoProp,
    setAlgo,
    onHelp,
    // ui
    themeMode = "dark",
    setThemeMode,
    // layout
    layout,
    onLayoutChange,
    // columns toggle
    showMatchSupport = false,
    setShowMatchSupport,

    // A2 run
    matrixName,
    selected,
    onApplied,
  } = props;

  const [tab, setTab] = useState<TabKey>("overview");

  // 親が未提供でも動くよう、ローカルへフォールバック
  const [localAlgo, setLocalAlgo] = useState<"bayes" | "heuristic">(algoProp ?? "bayes");
  const [localMode, setLocalMode] = useState<"lenient" | "strict">(modeProp ?? "lenient");
  React.useEffect(() => { if (algoProp !== undefined) setLocalAlgo(algoProp); }, [algoProp]);
  React.useEffect(() => { if (modeProp !== undefined) setLocalMode(modeProp); }, [modeProp]);

  const handleAlgoChange = (val: "bayes" | "heuristic") => { setLocalAlgo(val); setAlgo?.(val); };
  const handleModeChange = (val: "lenient" | "strict") => { setLocalMode(val); setMode?.(val); };

  const setLayout = (k: keyof LayoutState, v: PanelKey) => {
    if (!layout || !onLayoutChange) return;
    onLayoutChange({ ...layout, [k]: v });
  };

  // 簡単な統計
  const selectedCount = useMemo(() => {
    if (!selected) return 0;
    return Object.values(selected).filter(v => v !== 0 && v !== undefined && v !== null).length;
  }, [selected]);

  // ─────────────────────────────
  // 診断パネル（applyFilters の送受信を可視化）
  // ─────────────────────────────
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastReq, setLastReq] = useState<any | null>(null);
  const [lastRes, setLastRes] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const runDiagnostic = async (payload: {
    selected: Record<string, number>,
    mode: "strict" | "lenient",
    algorithm: "bayes" | "heuristic",
  }) => {
    setBusy(true);
    try {
      setLastReq(payload);
      const res = await applyFilters(payload.selected, payload.mode, payload.algorithm, {
        defaultAlphaFP: 0.03,
        defaultBetaFN: 0.07,
        gammaNAPenalty: 0.95,
        kappa: 1.0,
        epsilonCut: 1e-6,
        useHardContradiction: true,
        wantInfoGain: false,
      });
      setLastRes(res);
      props.onApplied?.(res);
      // 可能ならコンソールにも
      // eslint-disable-next-line no-console
      console.debug("[A2] applyFilters response", res);
    } catch (e) {
      console.error("[A2] applyFilters error", e);
      setLastRes({ error: String(e) });
    } finally {
      setBusy(false);
      if (!debugOpen) setDebugOpen(true);
    }
  };

  const copyJson = (obj: any) => {
    try { navigator.clipboard.writeText(JSON.stringify(obj, null, 2)); } catch {}
  };

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
      <Toolbar sx={{ px: 2, minHeight: 60, gap: 1 }}>
        {/* 左：タブ */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{ minHeight: 44 }}
        >
          <Tab icon={<InfoOutlinedIcon fontSize="small" />} iconPosition="start" label="概要" value="overview" sx={{ minHeight: 44 }} />
          <Tab icon={<TuneIcon fontSize="small" />} iconPosition="start" label="アルゴリズム" value="algo" sx={{ minHeight: 44 }} />
          <Tab label="表示" value="view" sx={{ minHeight: 44 }} />
          <Tab icon={<HelpOutlineIcon fontSize="small" />} iconPosition="start" label="ヘルプ" value="help" sx={{ minHeight: 44 }} />
        </Tabs>

        {/* 右：常時表示のミニ・マトリクス選択（どのタブにいても切替可能） */}
        <Box sx={{ flex: 1 }} />
        {onPickKey && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="key-mini-label">マトリクス</InputLabel>
            <Select
              labelId="key-mini-label"
              label="マトリクス"
              value={activeKey || ""}
              onChange={async (e) => onPickKey(String(e.target.value))}
            >
              {(keys || []).map((k) => (
                <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {onRefreshKeys && (
          <Tooltip title="キー一覧を再取得">
            <IconButton size="small" onClick={onRefreshKeys} sx={{ ml: 0.5 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}

        {setLang && (
          <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
            <InputLabel id="lang-label">言語</InputLabel>
            <Select labelId="lang-label" label="言語" value={lang} onChange={(e) => setLang(e.target.value as "ja" | "en")}>
              <MenuItem value="ja">日本語</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        )}

        {onHelp && (
          <IconButton size="small" onClick={onHelp} title="ヘルプ" sx={{ ml: 0.5 }}>
            <HelpOutlineIcon />
          </IconButton>
        )}
      </Toolbar>

      <Box sx={{ px: 2, py: 1.25, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        {/* 0: 概要 */}
        {tab === "overview" && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
              <Typography variant="subtitle1">マトリクス：{matrixName || "(未設定)"}</Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip size="small" label={`選択中の形質数: ${selectedCount}`} />
                {onPickKey && (
                  <FormControl size="small" sx={{ minWidth: 280 }}>
                    <InputLabel id="key-label">マトリクス（ホーム）</InputLabel>
                    <Select
                      labelId="key-label"
                      label="マトリクス（ホーム）"
                      value={activeKey || ""}
                      onChange={async (e) => onPickKey(String(e.target.value))}
                    >
                      {(keys || []).map((k) => (
                        <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {onRefreshKeys && (
                  <Button size="small" startIcon={<RefreshIcon />} onClick={onRefreshKeys}>
                    データ再取得
                  </Button>
                )}
              </Stack>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              上部の「アルゴリズム」タブから、Bayes（A2）のパラメータや strict/lenient の切替を行って同定候補のランキングを更新します。
              設定はマトリクスごとにローカル保存され、切替時に自動復元されます。
            </Typography>

            {/* 診断パネルのトグル */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size="small"
                variant={debugOpen ? "contained" : "outlined"}
                color="secondary"
                startIcon={<BugReportIcon />}
                onClick={() => setDebugOpen(v => !v)}
              >
                診断パネル
              </Button>
              {lastRes?.scores && Array.isArray(lastRes.scores) && (
                <Chip size="small" label={`直近の候補: ${lastRes.scores.length}`} />
              )}
            </Stack>

            <Collapse in={debugOpen}>
              <Box sx={{ p: 2, bgcolor: "background.paper", border: (t)=>`1px solid ${t.palette.divider}`, borderRadius: 1 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">A2 診断</Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busy}
                      onClick={() => runDiagnostic({ selected, mode: localMode, algorithm: localAlgo })}
                    >
                      現在の選択で実行
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busy}
                      onClick={() => runDiagnostic({ selected: {}, mode: "strict", algorithm: "bayes" })}
                    >
                      空選択で試験（Bayes/strict）
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busy}
                      onClick={() => runDiagnostic({ selected: {}, mode: "lenient", algorithm: "bayes" })}
                    >
                      空選択で試験（Bayes/lenient）
                    </Button>
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">直近のリクエスト</Typography>
                      <pre style={{ margin: 0, maxHeight: 180, overflow: "auto" }}>
                        {JSON.stringify(lastReq, null, 2)}
                      </pre>
                      <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyJson(lastReq)}>
                        コピー
                      </Button>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">直近のレスポンス</Typography>
                      <pre style={{ margin: 0, maxHeight: 180, overflow: "auto" }}>
                        {JSON.stringify(lastRes, null, 2)}
                      </pre>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {lastRes && (
                          <>
                            <Chip size="small" label={`scores: ${Array.isArray(lastRes?.scores) ? lastRes.scores.length : 0}`} />
                            <Chip size="small" label={`suggestions: ${Array.isArray(lastRes?.suggestions) ? lastRes.suggestions.length : 0}`} />
                          </>
                        )}
                      </Stack>
                      <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyJson(lastRes)}>
                        コピー
                      </Button>
                    </Box>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    ✅ 期待挙動：空選択でも均一な事後分布で <b>全タクサが返る</b>（同率）。<br/>
                    ❌ 実際が 0 件なら、<b>バックエンドが空配列を返している</b>可能性が高いです（互換スタブが残っている／アダプタ不通）。
                  </Typography>
                </Stack>
              </Box>
            </Collapse>
          </Stack>
        )}

        {/* 1: アルゴリズム */}
        {tab === "algo" && (
          <RibbonAlgoTab
            matrixName={matrixName}
            selected={selected}
            onApplied={onApplied}
            defaultAlgorithm={localAlgo}
            defaultMode={localMode}
            autoApply={true}
            debounceMs={300}
          />
        )}

        {/* 2: 表示 */}
        {tab === "view" && (
          <Stack spacing={2}>
            {setThemeMode && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="theme-label">テーマ</InputLabel>
                <Select labelId="theme-label" label="テーマ" value={themeMode}
                        onChange={(e) => setThemeMode(e.target.value as "dark" | "light")}>
                  <MenuItem value="dark">ダーク</MenuItem>
                  <MenuItem value="light">ライト</MenuItem>
                </Select>
              </FormControl>
            )}

            {layout && onLayoutChange && (
              <>
                <Divider flexItem />
                <Typography variant="body2">2×2 配置</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {(["tl", "tr", "bl", "br"] as (keyof LayoutState)[]).map((k, i) => {
                    const label = ["左上", "右上", "左下", "右下"][i];
                    return (
                      <FormControl key={k} size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>{label}</InputLabel>
                        <Select label={label} value={layout[k]} onChange={(e) => setLayout(k, e.target.value as PanelKey)}>
                          {(Object.keys(PANEL_LABEL) as PanelKey[]).map((pk) => (
                            <MenuItem key={pk} value={pk}>{PANEL_LABEL[pk]}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  })}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onLayoutChange({
                      tl: "candidates", tr: "history", bl: "traits_unselected", br: "traits_selected",
                    } as LayoutState)}
                  >
                    デフォルト
                  </Button>
                </Stack>
              </>
            )}

            {setShowMatchSupport && (
              <FormControlLabel
                control={<Switch checked={showMatchSupport} onChange={(e) => setShowMatchSupport(e.target.checked)} />}
                label="Match/Support 列を表示"
              />
            )}
          </Stack>
        )}

        {/* 3: ヘルプ */}
        {tab === "help" && (
          <Box sx={{ color: "text.secondary", lineHeight: 1.8 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>ヘルプ</Typography>
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              <li><b>Post</b>: 事後確率（現在の観測と整合する度合い）</li>
              <li><b>Δ</b>: 1位との差（小さいほど混戦＝追加形質が有効）</li>
              <li><b>Used / Conf</b>: 使用観測数 / 矛盾数</li>
              <li>空選択でも候補一覧が出ない場合は、概要タブの<b>診断パネル</b>で原因を切り分けてください。</li>
            </ul>
          </Box>
        )}
      </Box>
    </AppBar>
  );
}
