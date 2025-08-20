// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useMemo } from "react";
import {
  Paper, Box, Typography, Stack, Button, ButtonGroup, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Tooltip
} from "@mui/material";
import { STR } from "../../../i18n";

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
  suggMap: Record<string, number>;
  suggRank?: Record<string, number>;
  lang?: "ja" | "en";
};

// ... (utility functions rowScore, rowRank, ScoreBar remain the same) ...

function rowScore(row: TraitRow, suggMap: Record<string, number>): number {
    if (row.type === "binary") return suggMap[row.binary.id] ?? -1;
    const vals = row.children.map((c) => suggMap[c.id] ?? -1);
    return vals.length > 0 ? Math.max(...vals) : -1;
}
  
function rowRank(row: TraitRow, rank?: Record<string, number>): number | undefined {
    if (!rank) return undefined;
    if (row.type === "binary") return rank[row.binary.id];
    const vals = row.children.map((c) => rank?.[c.id]).filter((x): x is number => typeof x === "number");
    return vals.length > 0 ? Math.min(...vals) : undefined;
}

const ScoreBar = React.memo(({ value }: { value: number }) => {
    if (!(value > 0)) return null;
    const w = Math.max(2, Math.min(100, Math.round(value * 100)));
    return (
      <Tooltip title={`Normalized score: ${value.toFixed(3)}`}>
        <Box sx={{ width: '100%', height: 4, mt: 0.5, borderRadius: 2, bgcolor: "action.hover" }}>
          <Box sx={{ width: `${w}%`, height: '100%', borderRadius: 2, bgcolor: "primary.main", opacity: 0.6 }} />
        </Box>
      </Tooltip>
    );
});

const RowRenderer = React.memo(({ r, selected, setBinary, setDerivedPick, clearDerived, rank, scoreNorm, scoreRaw, lang = "ja", parentInfo }: {
  r: TraitRow;
  selected: Record<string, number>;
  setBinary: Props["setBinary"];
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  scoreNorm: number;
  scoreRaw: number;
  lang?: "ja" | "en";
  parentInfo: { isDisabled: boolean, reason: string };
}) => {
  const T = STR[lang];
  const chosenId = r.type === 'derived' ? r.children.find(c => selected[c.id] === 1)?.id : undefined;

  return (
    <TableRow hover sx={{ opacity: parentInfo.isDisabled ? 0.5 : 1 }}>
      <TableCell align="center">{typeof rank === "number" ? <Chip size="small" label={`#${rank}`} /> : "—"}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{scoreRaw >= 0 ? scoreRaw.toFixed(3) : "—"}</Typography>
        <ScoreBar value={scoreNorm} />
      </TableCell>
      <TableCell>{r.group}</TableCell>
      <TableCell><Typography variant="body2">{r.traitName}</Typography></TableCell>
      <TableCell>
        <Tooltip title={parentInfo.reason} placement="top-start">
            <span>
                <ButtonGroup variant="outlined" size="small" disabled={parentInfo.isDisabled}>
                {r.type === "binary" ? (
                    <>
                    <Button variant={selected[r.binary.id] === 1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>{T.traitsPanel.state_yes}</Button>
                    <Button variant={selected[r.binary.id] === -1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>{T.traitsPanel.state_no}</Button>
                    <Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>{T.traitsPanel.state_clear}</Button>
                    </>
                ) : (
                    <>
                    {r.children.map(c => (
                        <Button key={c.id} variant={chosenId === c.id ? 'contained' : 'outlined'} onClick={() => setDerivedPick(r.children.map(x => x.id), c.id, r.traitName)}>{c.label}</Button>
                    ))}
                    <Button onClick={() => clearDerived(r.children.map(x => x.id), r.traitName, false)}>{T.traitsPanel.state_clear}</Button>
                    </>
                )}
                </ButtonGroup>
            </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

export default function TraitsPanel(props: Props) {
  const { title, mode, rows, selected, setBinary, setDerivedPick, clearDerived, sortBy, setSortBy, suggMap, suggRank, lang = "ja" } = props;
  const T = STR[lang].traitsPanel;

  const parentMap = useMemo(() => {
    const map = new Map<string, { parentId: string, parentName: string }>();
    rows.forEach(row => {
        const parentName = row.type === 'binary' ? row.binary.parent : row.parent;
        if (parentName) {
            const parentRow = rows.find(r => r.traitName === parentName && r.type === 'binary');
            if (parentRow && parentRow.type === 'binary') {
                const childId = row.type === 'binary' ? row.binary.id : row.children.map(c => c.id).join(',');
                 map.set(childId, { parentId: parentRow.binary.id, parentName: parentRow.traitName });
            }
        }
    });
    return map;
  }, [rows]);

  const filteredAndSortedRows = useMemo(() => {
    // ... (filtering and sorting logic remains the same)
    const filtered = rows.filter(r => {
        const isSelected = r.type === "binary" ? (selected[r.binary.id] ?? 0) !== 0 : r.children.some(c => selected[c.id] === 1);
        return mode === 'selected' ? isSelected : !isSelected;
      });
  
    return filtered.sort((a, b) => {
        if (sortBy === "recommend") {
          const rankA = rowRank(a, suggRank); const rankB = rowRank(b, suggRank);
          if (rankA !== undefined && rankB !== undefined && rankA !== rankB) return rankA - rankB;
          const scoreA = rowScore(a, suggMap); const scoreB = rowScore(b, suggMap);
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        if (sortBy === "group") {
          const groupCompare = (a.group || "").localeCompare(b.group || "");
          if (groupCompare !== 0) return groupCompare;
        }
        return a.traitName.localeCompare(b.traitName);
      });
  }, [rows, mode, selected, sortBy, suggMap, suggRank]);

  const scoreNormalizer = useMemo(() => {
    // ... (score normalization logic remains the same)
    const scores = rows.map(r => rowScore(r, suggMap)).filter(s => s >= 0);
    if (scores.length === 0) return () => 0;
    const max = Math.max(...scores);
    return (score: number) => (max > 0 ? score / max : 0);
  }, [rows, suggMap]);

  return (
    <Paper sx={{ p: 1.5, display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 0.5 }}>
        <Typography variant="h6">{title}</Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>{T.sort_recommend}</Button>
          <Button onClick={() => setSortBy("group")} variant={sortBy === "group" ? "contained" : "outlined"}>{T.sort_group}</Button>
          <Button onClick={() => setSortBy("name")} variant={sortBy === "name" ? "contained" : "outlined"}>{T.sort_name}</Button>
        </ButtonGroup>
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
                const childId = r.type === 'binary' ? r.binary.id : r.children.map(c => c.id).join(',');
                const parent = parentMap.get(childId);
                let parentInfo = { isDisabled: false, reason: "" };
                if (parent) {
                    const parentSelection = selected[parent.parentId];
                    if (parentSelection === -1) { // If parent is 'No'
                        parentInfo = { isDisabled: true, reason: `Disabled because '${parent.parentName}' is 'No'` };
                    }
                }

              return (<RowRenderer
                key={r.type === 'binary' ? r.binary.id : r.traitName}
                r={r}
                selected={selected}
                setBinary={setBinary}
                setDerivedPick={setDerivedPick}
                clearDerived={clearDerived}
                rank={rowRank(r, suggRank)}
                scoreRaw={rowScore(r, suggMap)}
                scoreNorm={scoreNormalizer(rowScore(r, suggMap))}
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