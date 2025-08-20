// frontend/src/components/panels/candidates/CandidatesPanel.tsx
import React from "react";
import {
  Paper, Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, LinearProgress, Tooltip, Chip,
  Stack, Checkbox, Button
} from "@mui/material";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { STR } from "../../../i18n";
import { Taxon } from "../../../api";

export type EngineScore = {
  rank?: number;
  taxon: { id?: string; name: string };
  post?: number;
  delta?: number;
  used?: number;
  conflicts?: number;
  match?: number;
  support?: number;
};

const ScoreCell = ({ score }: { score: number }) => (
    <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {(score * 100).toFixed(2)}%
        </Typography>
        <LinearProgress
            variant="determinate"
            value={score * 100}
            sx={{ height: 6, borderRadius: 3 }}
        />
    </TableCell>
);

export default function CandidatesPanel({
  title, rows, totalTaxa, showMatchSupport = false, lang = "ja",
  comparisonList, setComparisonList, onCompareClick,
}: {
  title?: string;
  rows: EngineScore[];
  totalTaxa: number;
  showMatchSupport?: boolean;
  lang?: "ja" | "en";
  comparisonList: string[];
  setComparisonList: React.Dispatch<React.SetStateAction<string[]>>;
  onCompareClick: () => void;
}) {
  const T = STR[lang].candidatesPanel;

  const handleCompareChange = (taxonId: string, checked: boolean) => {
    if (checked) {
        setComparisonList(prev => [...prev, taxonId]);
    } else {
        setComparisonList(prev => prev.filter(id => id !== taxonId));
    }
  };

  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">{title || STR[lang].panels.candidates}</Typography>
            <Chip label={`${rows?.length ?? 0} / ${totalTaxa}`} size="small" />
        </Stack>
        <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrowsIcon/>}
            onClick={onCompareClick}
            disabled={comparisonList.length < 2}
        >
            {T.compare_button} ({comparisonList.length})
        </Button>
      </Stack>

      <TableContainer component={Box} sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell sx={{ width: 50 }}>{T.header_rank}</TableCell>
              <TableCell>{T.header_name}</TableCell>
              <TableCell sx={{ width: 120 }}><Tooltip title={T.tooltip_post}><span>{T.header_post}</span></Tooltip></TableCell>
              <TableCell sx={{ width: 80 }}><Tooltip title={T.tooltip_delta}><span>{T.header_delta}</span></Tooltip></TableCell>
              <TableCell sx={{ width: 70 }} align="center"><Tooltip title={T.tooltip_conflicts}><span>{T.header_conflicts}</span></Tooltip></TableCell>
              {showMatchSupport && <TableCell sx={{ width: 110 }}>{T.header_match_support}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((r, i) => {
              const taxonId = r.taxon?.id ?? "";
              const isChecked = comparisonList.includes(taxonId);
              return (
              <TableRow
                key={taxonId || `${i}-${r.taxon?.name}`}
                hover
                sx={{ bgcolor: (r.conflicts ?? 0) > 0 ? 'rgba(255, 170, 170, 0.1)' : 'transparent' }}
              >
                <TableCell padding="checkbox">
                    <Checkbox
                        size="small"
                        checked={isChecked}
                        onChange={(e) => handleCompareChange(taxonId, e.target.checked)}
                        disabled={!taxonId}
                    />
                </TableCell>
                <TableCell>{r.rank ?? i + 1}</TableCell>
                <TableCell>{r.taxon?.name}</TableCell>
                <ScoreCell score={r.post ?? 0} />
                <TableCell>{(r.delta ?? 0).toExponential(2)}</TableCell>
                <TableCell align="center">
                  {(r.conflicts ?? 0) > 0 ? (
                    <Chip label={r.conflicts} color="error" size="small" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">0</Typography>
                  )}
                </TableCell>
                {showMatchSupport && <TableCell>{`${r.match ?? 0}/${r.support ?? 0}`}</TableCell>}
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}