// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useMemo } from "react";
import {
  Paper, Box, Typography, Stack, Button, ButtonGroup, Chip, Table, TableHead,
  TableRow, TableCell, TableContainer, Tooltip,
  TableBody
} from "@mui/material";
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import { STR } from "../../../i18n";
import { Trait, TraitSuggestion } from "../../../api";
import { AlgoOptions } from "../../../hooks/useAlgoOpts";

export type TraitRow =
  | { group: string; traitName: string; type: "binary"; binary: Trait }
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[]; parentTrait: Trait };

type Props = {
  mode: "unselected" | "selected";
  rows: TraitRow[];
  selected: Record<string, number>;
  setBinary: (traitId: string, val: number, label: string) => void;
  setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
  clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
  sortBy: "recommend" | "group" | "name";
  suggMap: Record<string, TraitSuggestion>;
  onTraitSelect: (trait?: Trait) => void;
  lang?: "ja" | "en";
  // 親から移動してきたため不要になるProps
  // title?: string;
  // setSortBy: React.Dispatch<React.SetStateAction<"recommend" | "group" | "name">>;
  // suggRank?: Record<string, number>;
  // opts: AlgoOptions;
  // setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
};

function getRowSuggestion(row: TraitRow, suggMap: Record<string, TraitSuggestion>): TraitSuggestion | undefined {
    if (row.type === "binary") {
        return suggMap[row.binary.id];
    }
    return suggMap[row.parentTrait.id];
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

const RowRenderer = React.memo(({ r, selected, setBinary, setDerivedPick, clearDerived, rank, suggestion, onTraitSelect, lang = "ja" }: {
  r: TraitRow;
  selected: Record<string, number>;
  setBinary: Props["setBinary"];
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  suggestion?: TraitSuggestion;
  onTraitSelect: (trait?: Trait) => void;
  lang?: "ja" | "en";
}) => {
  const T = STR[lang].traitsPanel;
  const chosenId = r.type === 'derived' ? r.children.find(c => selected[c.id] === 1)?.id : undefined;
  const traitObject = r.type === 'binary' ? r.binary : r.parentTrait;

  const hasHelpText = traitObject.helpText && traitObject.helpText.trim() !== "";
  const hasHelpImages = traitObject.helpImages && traitObject.helpImages.length > 0;

  return (
    <TableRow hover onClick={() => onTraitSelect(traitObject)} sx={{ cursor: 'pointer' }}>
      <TableCell align="center">{typeof rank === "number" ? <Chip size="small" label={`#${rank}`} /> : "—"}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{suggestion ? suggestion.score.toFixed(3) : "—"}</Typography>
        <ScoreBar suggestion={suggestion} />
      </TableCell>
      <TableCell>{r.group}</TableCell>
      <TableCell>{r.traitName}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5}>
            {hasHelpText && <DescriptionIcon fontSize="small" color="action" />}
            {hasHelpImages && <ImageIcon fontSize="small" color="action" />}
        </Stack>
      </TableCell>
      <TableCell>
        {r.type === "binary" ? (
             <ButtonGroup variant="outlined" size="small" onClick={(e) => e.stopPropagation()}>
                <Button variant={selected[r.binary.id] === 1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>{T.state_yes}</Button>
                <Button variant={selected[r.binary.id] === -1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>{T.state_no}</Button>
                <Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>{T.state_clear}</Button>
            </ButtonGroup>
        ) : (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                {r.children.map(c => (
                    <Button key={c.id} size="small" variant={chosenId === c.id ? 'contained' : 'outlined'} onClick={() => setDerivedPick(r.children.map(x => x.id), c.id, r.traitName)}>{c.label}</Button>
                ))}
                <Button size="small" variant="outlined" onClick={() => clearDerived(r.children.map(x => x.id), r.traitName, false)}>{T.state_clear}</Button>
            </Stack>
        )}
      </TableCell>
    </TableRow>
  );
});

export default function TraitsPanel(props: Props) {
  const { mode, rows, selected, setBinary, setDerivedPick, clearDerived, sortBy, suggMap, onTraitSelect, lang = "ja" } = props;
  
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
      <TableContainer component={Box} sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }} align="center">Rank</TableCell>
              <TableCell sx={{ width: 120 }}>Score</TableCell>
              <TableCell sx={{ width: 160 }}>Group</TableCell>
              <TableCell>Trait</TableCell>
              <TableCell sx={{ width: 80 }}>Help</TableCell>
              <TableCell>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRows.map((r) => {
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
                onTraitSelect={onTraitSelect}
              />);
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}