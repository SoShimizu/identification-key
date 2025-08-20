// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useMemo } from "react";
import {
  Paper, Box, Typography, Stack, Button, ButtonGroup, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Tooltip
} from "@mui/material";

type Choice = -1 | 0 | 1;

export type TraitRow =
  | { group: string; traitName: string; type: "binary"; binary: { id: string } }
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[] };

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
  suggAlgo?: "gini" | "entropy";
  setSuggAlgo?: (a: "gini" | "entropy") => void;
};

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


const RowRenderer = React.memo(({ r, selected, setBinary, setDerivedPick, clearDerived, rank, scoreNorm, scoreRaw }: {
  r: TraitRow;
  selected: Record<string, number>;
  setBinary: Props["setBinary"];
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  scoreNorm: number;
  scoreRaw: number;
}) => {
  const chosenId = r.type === 'derived' ? r.children.find(c => selected[c.id] === 1)?.id : undefined;

  return (
    <TableRow hover>
      <TableCell align="center">{typeof rank === "number" ? <Chip size="small" label={`#${rank}`} /> : "—"}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{scoreRaw > 0 ? scoreRaw.toFixed(3) : "—"}</Typography>
        <ScoreBar value={scoreNorm} />
      </TableCell>
      <TableCell>{r.group}</TableCell>
      <TableCell><Typography variant="body2">{r.traitName}</Typography></TableCell>
      <TableCell>
        <ButtonGroup variant="outlined" size="small">
          {r.type === "binary" ? (
            <>
              <Button variant={selected[r.binary.id] === 1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>Yes</Button>
              <Button variant={selected[r.binary.id] === -1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>No</Button>
              <Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>Clear</Button>
            </>
          ) : (
            <>
              {r.children.map(c => (
                <Button key={c.id} variant={chosenId === c.id ? 'contained' : 'outlined'} onClick={() => setDerivedPick(r.children.map(x => x.id), c.id, r.traitName)}>{c.label}</Button>
              ))}
              <Button onClick={() => clearDerived(r.children.map(x => x.id), r.traitName, false)}>Clear</Button>
            </>
          )}
        </ButtonGroup>
      </TableCell>
    </TableRow>
  );
});

export default function TraitsPanel(props: Props) {
  const { title, mode, rows, selected, setBinary, setDerivedPick, clearDerived, sortBy, setSortBy, suggMap, suggRank } = props;

  const filteredAndSortedRows = useMemo(() => {
    const scoreOf = (x: TraitRow) => rowScore(x, suggMap);
    const rankOf  = (x: TraitRow) => rowRank(x, suggRank);

    const filtered = rows.filter(r => {
      const isSelected = r.type === "binary" ? (selected[r.binary.id] ?? 0) !== 0 : r.children.some(c => selected[c.id] === 1);
      return mode === 'selected' ? isSelected : !isSelected;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "recommend") {
        const rankA = rankOf(a); const rankB = rankOf(b);
        if (rankA !== undefined && rankB !== undefined && rankA !== rankB) return rankA - rankB;
        const scoreA = scoreOf(a); const scoreB = scoreOf(b);
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
          <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>推奨順</Button>
          <Button onClick={() => setSortBy("group")} variant={sortBy === "group" ? "contained" : "outlined"}>グループ別</Button>
          <Button onClick={() => setSortBy("name")} variant={sortBy === "name" ? "contained" : "outlined"}>名前順</Button>
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
            {filteredAndSortedRows.map((r) => (
              <RowRenderer
                key={r.type === 'binary' ? r.binary.id : r.traitName}
                r={r}
                selected={selected}
                setBinary={setBinary}
                setDerivedPick={setDerivedPick}
                clearDerived={clearDerived}
                rank={rowRank(r, suggRank)}
                scoreRaw={rowScore(r, suggMap)}
                scoreNorm={scoreNormalizer(rowScore(r, suggMap))}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}