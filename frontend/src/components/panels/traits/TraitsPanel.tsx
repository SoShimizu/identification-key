// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useMemo } from "react";
import {
  Paper, Box, Typography, Stack, Button, ButtonGroup, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Tooltip, FormControlLabel, Switch
} from "@mui/material";
import { STR } from "../../../i18n";
import { Trait, TraitSuggestion } from "../../../api";
import { AlgoOptions } from "../../../hooks/useAlgoOpts";

type Choice = -1 | 0 | 1;

export type TraitRow =
  | { group: string; traitName: string; type: "binary"; binary: { id: string, parent?: string } }
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[], parent?: string };

type Props = {
  title?: string;
  mode: "unselected" | "selected";
  rows: TraitRow[];
  selected: Record<string, number>;
  setBinary: (traitId: string, val: number, label: string) => void;
  setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
  clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
  sortBy: "recommend" | "group" | "name";
  setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;
  suggMap: Record<string, TraitSuggestion>;
  suggRank?: Record<string, number>;
  opts: AlgoOptions; // ✨ propsを追加
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>; // ✨ propsを追加
  lang?: "ja" | "en";
};

// ... (getRowSuggestion, rowRank, ScoreBar, RowRenderer functions remain the same)
function getRowSuggestion(row: TraitRow, suggMap: Record<string, TraitSuggestion>): TraitSuggestion | undefined {
    if (row.type === "binary") {
        return suggMap[row.binary.id];
    }
    let parentSugg: TraitSuggestion | undefined;
    for (const sugg of Object.values(suggMap)) {
        if (sugg.name === row.traitName && sugg.group === row.group) {
            parentSugg = sugg;
            break;
        }
    }
    return parentSugg;
}
function rowRank(row: TraitRow, rankMap?: Record<string, number>, suggMap?: Record<string, TraitSuggestion>): number | undefined {
    if (!rankMap) return undefined;
    const suggestion = getRowSuggestion(row, suggMap || {});
    return suggestion ? rankMap[suggestion.traitId] : undefined;
}
const ScoreBar = React.memo(({ suggestion }: { suggestion?: TraitSuggestion }) => {
    if (!suggestion || !(suggestion.score > 0)) return null;
    const normalizedScore = suggestion.ig > 0 ? (suggestion.score / suggestion.ig) : 0;
    const w = Math.max(2, Math.min(100, Math.round(normalizedScore * 100)));
    const tooltipTitle = `Score: ${suggestion.score.toFixed(3)} (IG: ${suggestion.ig?.toFixed(3) ?? 'N/A'} / Difficulty: ${suggestion.difficulty?.toFixed(1) ?? 'N/A'} * RiskFactor: ${(1 - (suggestion.risk ?? 0)).toFixed(2)})`;

    return (
      <Tooltip title={tooltipTitle}>
        <Box sx={{ width: '100%', height: 4, mt: 0.5, borderRadius: 2, bgcolor: "action.hover" }}>
          <Box sx={{ width: `${w}%`, height: '100%', borderRadius: 2, bgcolor: "primary.main", opacity: 0.6 }} />
        </Box>
      </Tooltip>
    );
});
const RowRenderer = React.memo(({ r, selected, setBinary, setDerivedPick, clearDerived, rank, suggestion, parentInfo, lang = "ja" }: {
  r: TraitRow;
  selected: Record<string, number>;
  setBinary: Props["setBinary"];
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  suggestion?: TraitSuggestion;
  parentInfo: { isDisabled: boolean, reason: string };
  lang?: "ja" | "en";
}) => {
  const T = STR[lang];
  const chosenId = r.type === 'derived' ? r.children.find(c => selected[c.id] === 1)?.id : undefined;

  return (
    <TableRow hover sx={{ opacity: parentInfo.isDisabled ? 0.5 : 1 }}>
      <TableCell align="center">{typeof rank === "number" ? <Chip size="small" label={`#${rank}`} /> : "—"}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{suggestion ? suggestion.score.toFixed(3) : "—"}</Typography>
        <ScoreBar suggestion={suggestion} />
      </TableCell>
      <TableCell>{r.group}</TableCell>
      <TableCell><Typography variant="body2">{r.traitName}</Typography></TableCell>
      <TableCell>
        <Tooltip title={parentInfo.reason} placement="top-start">
            <Box>
                {r.type === "binary" ? (
                     <ButtonGroup variant="outlined" size="small" disabled={parentInfo.isDisabled}>
                        <Button variant={selected[r.binary.id] === 1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>{T.traitsPanel.state_yes}</Button>
                        <Button variant={selected[r.binary.id] === -1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>{T.traitsPanel.state_no}</Button>
                        <Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>{T.traitsPanel.state_clear}</Button>
                    </ButtonGroup>
                ) : (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                        {r.children.map(c => (
                            <Button key={c.id} size="small" variant={chosenId === c.id ? 'contained' : 'outlined'} onClick={() => setDerivedPick(r.children.map(x => x.id), c.id, r.traitName)}>{c.label}</Button>
                        ))}
                        <Button size="small" variant="outlined" onClick={() => clearDerived(r.children.map(x => x.id), r.traitName, false)}>{T.traitsPanel.state_clear}</Button>
                    </Stack>
                )}
            </Box>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});


export default function TraitsPanel(props: Props) {
  const { title, mode, rows, selected, setBinary, setDerivedPick, clearDerived, sortBy, setSortBy, suggMap, opts, setOpts, lang = "ja" } = props;
  const T = STR[lang].traitsPanel;
  
  const handleBool = (key: keyof AlgoOptions) => (_: any, checked: boolean) => {
    setOpts({ ...opts, [key]: checked });
  };

  const filteredAndSortedRows = useMemo(() => {
    const filtered = rows.filter(r => {
        if (r.type === 'binary') {
            const isSelected = (selected[r.binary.id] ?? 0) !== 0;
            return mode === 'selected' ? isSelected : !isSelected;
        }
        const isSelected = r.children.some(c => selected[c.id] === 1);
        return mode === 'selected' ? isSelected : !isSelected;
    });
  
    return filtered.sort((a, b) => {
        if (sortBy === "recommend") {
          const suggA = getRowSuggestion(a, suggMap);
          const suggB = getRowSuggestion(b, suggMap);
          const scoreA = suggA?.score ?? -1;
          const scoreB = suggB?.score ?? -1;
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        if (sortBy === "group") {
          const groupCompare = (a.group || "").localeCompare(b.group || "");
          if (groupCompare !== 0) return groupCompare;
        }
        return a.traitName.localeCompare(b.traitName);
      });
  }, [rows, mode, selected, sortBy, suggMap]);

  const localSuggRank = useMemo(() => {
    if (sortBy !== 'recommend') return {};
    const rank: Record<string, number> = {};
    filteredAndSortedRows.forEach((row, i) => {
        const sugg = getRowSuggestion(row, suggMap);
        if (sugg) {
            rank[sugg.traitId] = i + 1;
        }
    });
    return rank;
  }, [filteredAndSortedRows, sortBy, suggMap]);


  return (
    <Paper sx={{ p: 1.5, display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 0.5, flexWrap: 'wrap' }}>
        <Typography variant="h6">{title}</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
            {/* ✨ スイッチをここに移動 */}
            {sortBy === 'recommend' && mode === 'unselected' && (
                <FormControlLabel 
                    control={<Switch size="small" checked={opts.usePragmaticScore} onChange={handleBool("usePragmaticScore")} />} 
                    label={<Typography variant="caption">実用性スコア</Typography>}
                />
            )}
            <ButtonGroup size="small" variant="outlined">
                <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>{T.sort_recommend}</Button>
                <Button onClick={() => setSortBy("group")} variant={sortBy === "group" ? "contained" : "outlined"}>{T.sort_group}</Button>
                <Button onClick={() => setSortBy("name")} variant={sortBy === "name" ? "contained" : "outlined"}>{T.sort_name}</Button>
            </ButtonGroup>
        </Stack>
      </Stack>

      <TableContainer component={Box} sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }} align="center">Rank</TableCell>
              <TableCell sx={{ width: 120 }}>Score</TableCell>
              <TableCell sx={{ width: 160 }}>Group</TableCell>
              <TableCell>Trait</TableCell>
              <TableCell>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRows.map((r) => {
                const parentInfo = { isDisabled: false, reason: "" };
                const suggestion = getRowSuggestion(r, suggMap);
              return (<RowRenderer
                key={r.type === 'binary' ? r.binary.id : r.traitName}
                r={r}
                selected={selected}
                setBinary={setBinary}
                setDerivedPick={setDerivedPick}
                clearDerived={clearDerived}
                rank={sortBy === 'recommend' ? localSuggRank[suggestion?.traitId ?? ''] : undefined}
                suggestion={suggestion}
                lang={lang}
                parentInfo={parentInfo}
              />);
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}