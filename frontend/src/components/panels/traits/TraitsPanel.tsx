// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useMemo } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";

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

  // 並べ替え
  sortBy: "recommend" | "group" | "name";
  setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;

  // 推奨度（traitID -> スコア）。大きいほど推奨
  suggMap: Record<string, number>;

  // ランク（traitID -> 1,2,3...）。無ければ undefined で「—」
  suggRank?: Record<string, number>;

  // 表示中の指標（現状は GINI / ENTROPY のみ）
  suggAlgo?: "gini" | "entropy";
  setSuggAlgo?: (a: "gini" | "entropy") => void;
};

function rowScore(row: TraitRow, suggMap: Record<string, number>): number {
  if (row.type === "binary") return suggMap[row.binary.id] ?? 0;
  const vals = row.children.map((c) => suggMap[c.id] ?? 0);
  return vals.length ? Math.max(...vals) : 0;
}

function rowRank(row: TraitRow, rank?: Record<string, number>): number | undefined {
  if (!rank) return undefined;
  if (row.type === "binary") return rank[row.binary.id];
  const vals = row.children.map((c) => rank[c.id]).filter((x) => typeof x === "number") as number[];
  if (!vals.length) return undefined;
  return Math.min(...vals);
}

function ScoreBar({ value }: { value: number }) {
  if (!(value > 0)) return null;
  const w = Math.max(6, Math.round(value * 100));
  return (
    <Box sx={{ position: "relative", height: 6, mt: 0.5, borderRadius: 3, bgcolor: "action.hover" }}>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${w}%`, borderRadius: 3, bgcolor: "primary.main", opacity: 0.35 }} />
    </Box>
  );
}

function CellRank({ rank }: { rank?: number }) {
  return (
    <TableCell sx={{ width: 90 }}>
      {typeof rank === "number" ? <Chip size="small" color="primary" variant="outlined" label={`#${rank}`} /> : <Typography variant="body2">—</Typography>}
    </TableCell>
  );
}

function CellScore({ raw, norm }: { raw: number; norm: number }) {
  return (
    <TableCell sx={{ width: 140 }}>
      <Typography variant="body2">{raw > 0 ? raw.toFixed(3) : "—"}</Typography>
      <ScoreBar value={norm} />
    </TableCell>
  );
}

function RowBinary({
  r, selected, setBinary, rank, scoreNorm, scoreRaw,
}: {
  r: Extract<TraitRow, { type: "binary" }>;
  selected: Record<string, number>;
  setBinary: Props["setBinary"];
  rank?: number;
  scoreNorm: number;
  scoreRaw: number;
}) {
  const v = (selected[r.binary.id] ?? 0) as Choice;
  return (
    <TableRow hover>
      <CellRank rank={rank} />
      <CellScore raw={scoreRaw} norm={scoreNorm} />
      <TableCell sx={{ width: 180 }}>{r.group}</TableCell>
      <TableCell><Typography variant="body2">{r.traitName}</Typography></TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          <Button size="small" variant={v === 1 ? "contained" : "outlined"} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>該当</Button>
          <Button size="small" variant={v === -1 ? "contained" : "outlined"} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>非該当</Button>
          <Button size="small" variant={v === 0 ? "contained" : "outlined"} onClick={() => setBinary(r.binary.id, 0, r.traitName)}>未選択</Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function RowDerived({
  r, selected, setDerivedPick, clearDerived, rank, scoreNorm, scoreRaw,
}: {
  r: Extract<TraitRow, { type: "derived" }>;
  selected: Record<string, number>;
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  scoreNorm: number;
  scoreRaw: number;
}) {
  const kids = r.children;
  const chosen = kids.find((c) => selected[c.id] === 1)?.id;
  return (
    <TableRow hover>
      <CellRank rank={rank} />
      <CellScore raw={scoreRaw} norm={scoreNorm} />
      <TableCell sx={{ width: 180 }}>{r.group}</TableCell>
      <TableCell><Typography variant="body2">{r.traitName}</Typography></TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          {kids.map((c) => (
            <Button
              key={c.id}
              size="small"
              variant={chosen === c.id ? "contained" : "outlined"}
              onClick={() => setDerivedPick(kids.map((x) => x.id), c.id, r.traitName)}
            >
              {c.label}
            </Button>
          ))}
          <Button size="small" variant="outlined" onClick={() => clearDerived(kids.map((x) => x.id), r.traitName, false)}>未選択</Button>
          <Button size="small" variant="outlined" onClick={() => clearDerived(kids.map((x) => x.id), r.traitName, true)}>未計測</Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function TraitsPanel({
  title, mode, rows, selected, setBinary, setDerivedPick, clearDerived,
  sortBy, setSortBy, suggMap, suggRank, suggAlgo, setSuggAlgo,
}: Props) {
  const scoreOf = (x: TraitRow) => rowScore(x, suggMap);
  const rankOf  = (x: TraitRow) => rowRank(x, suggRank);

  const sorted = useMemo(() => {
    const arr = [...rows];
    if (sortBy === "group") {
      arr.sort((a, b) => (a.group || "").localeCompare(b.group || "") || a.traitName.localeCompare(b.traitName));
    } else if (sortBy === "name") {
      arr.sort((a, b) => a.traitName.localeCompare(b.traitName));
    } else {
      arr.sort((a, b) => {
        const ra = rankOf(a); const rb = rankOf(b);
        if (typeof ra === "number" && typeof rb === "number" && ra !== rb) return ra - rb;
        const sa = scoreOf(a); const sb = scoreOf(b);
        if (sb !== sa) return sb - sa;
        return a.traitName.localeCompare(b.traitName);
      });
    }
    return arr;
  }, [rows, sortBy, suggMap, suggRank]); // eslint-disable-line

  const norm = useMemo(() => {
    const vals = rows.map(scoreOf);
    const max = Math.max(0, ...vals);
    const min = Math.min(0, ...vals);
    if (max === min) return (_: TraitRow) => 1;
    return (r: TraitRow) => (scoreOf(r) - min) / (max - min);
  }, [rows, suggMap]);

  const list = useMemo(() => {
    if (mode === "unselected") {
      return sorted.filter((r) =>
        r.type === "binary"
          ? (selected[r.binary.id] ?? 0) === 0
          : !r.children.some((c) => selected[c.id] === 1)
      );
    }
    return sorted.filter((r) =>
      r.type === "binary"
        ? (selected[r.binary.id] ?? 0) !== 0
        : r.children.some((c) => selected[c.id] === 1)
    );
  }, [sorted, selected, mode]);

  return (
    <Paper sx={{ p: 1.5, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title || "形質フィルタ"}
          <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
            {suggAlgo ? `（指標: ${suggAlgo.toUpperCase()}）` : null}
          </Typography>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setSortBy("recommend")} variant={sortBy === "recommend" ? "contained" : "outlined"}>推奨順</Button>
            <Button onClick={() => setSortBy("group")}     variant={sortBy === "group"     ? "contained" : "outlined"}>グループ</Button>
            <Button onClick={() => setSortBy("name")}      variant={sortBy === "name"      ? "contained" : "outlined"}>名前</Button>
          </ButtonGroup>
          {setSuggAlgo && (
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => setSuggAlgo!("gini")}    variant={suggAlgo === "gini"    ? "contained" : "outlined"}>GINI</Button>
              <Button onClick={() => setSuggAlgo!("entropy")} variant={suggAlgo === "entropy" ? "contained" : "outlined"}>ENTROPY</Button>
            </ButtonGroup>
          )}
        </Stack>
      </Box>

      <Typography variant="subtitle2" sx={{ px: 0.5, pb: 0.5, color: "text.secondary" }}>
        {mode === "unselected" ? "未選択の形質" : "選択済みの形質"}
      </Typography>

      <TableContainer sx={{ flex: 1, overflow: "auto", border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 90  }}>#</TableCell>
              <TableCell sx={{ width: 140 }}>score</TableCell>
              <TableCell sx={{ width: 180 }}>group</TableCell>
              <TableCell>trait</TableCell>
              <TableCell>state</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((r, i) =>
              r.type === "binary" ? (
                <RowBinary
                  key={`${r.traitName}-${i}`}
                  r={r}
                  selected={selected}
                  setBinary={setBinary}
                  rank={rowRank(r, suggRank)}
                  scoreNorm={norm(r)}
                  scoreRaw={rowScore(r, suggMap)}
                />
              ) : (
                <RowDerived
                  key={`${r.traitName}-${i}`}
                  r={r}
                  selected={selected}
                  setDerivedPick={setDerivedPick}
                  clearDerived={clearDerived}
                  rank={rowRank(r, suggRank)}
                  scoreNorm={norm(r)}
                  scoreRaw={rowScore(r, suggMap)}
                />
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ mt: 1 }} />
    </Paper>
  );
}
