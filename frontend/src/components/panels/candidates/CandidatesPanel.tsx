// frontend/src/components/panels/candidates/CandidatesPanel.tsx
import React, { useState } from "react";
import {
  Paper, Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, LinearProgress, Tooltip, Chip,
  Stack, Checkbox, Button, FormControlLabel, Switch, Modal, IconButton
} from "@mui/material";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { STR } from "../../../i18n";
import { Taxon, Justification, MultiChoice, Choice } from "../../../api";
import { GetJustificationForTaxon } from "../../../../wailsjs/go/main/App";
import JustificationPanel from "./JustificationPanel";
import { FormattedScientificName } from "../taxa/TaxonDetailPanel";

export type EngineScore = {
  rank?: number;
  taxon: Taxon;
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
  title, rows, totalTaxa, lang = "ja", algo,
  comparisonList, setComparisonList, onCompareClick, onTaxonSelect,
  selected, selectedMulti
}: {
  title?: string;
  rows: EngineScore[];
  totalTaxa: number;
  lang?: "ja" | "en";
  algo: "bayes" | "heuristic";
  comparisonList: string[];
  setComparisonList: React.Dispatch<React.SetStateAction<string[]>>;
  onCompareClick: () => void;
  onTaxonSelect: (taxon: Taxon) => void;
  selected: Record<string, Choice>;
  selectedMulti: Record<string, MultiChoice>;
}) {
  const T = STR[lang].candidatesPanel;
  const [showMatchSupport, setShowMatchSupport] = useState<boolean>(false);
  
  const [justificationOpen, setJustificationOpen] = useState(false);
  const [currentJustification, setCurrentJustification] = useState<Justification | null>(null);
  const [loadingJustification, setLoadingJustification] = useState(false);
  const [currentTargetTaxon, setCurrentTargetTaxon] = useState<Taxon | null>(null);

  const handleCompareChange = (taxonId: string, checked: boolean) => {
    if (checked) {
        setComparisonList(prev => [...prev, taxonId]);
    } else {
        setComparisonList(prev => prev.filter(id => id !== taxonId));
    }
  };
  
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((r) => r.taxon.id).filter((id): id is string => !!id);
      setComparisonList(newSelecteds);
      return;
    }
    setComparisonList([]);
  };

  const handleWhyClick = async (e: React.MouseEvent, taxon: Taxon) => {
      e.stopPropagation();
      setLoadingJustification(true);
      setJustificationOpen(true);
      setCurrentTargetTaxon(taxon);
      try {
          const result = await GetJustificationForTaxon(taxon.id, selected, selectedMulti);
          setCurrentJustification(result as Justification);
      } catch (error) {
          console.error("Failed to get justification:", error);
      } finally {
          setLoadingJustification(false);
      }
  };


  const scoreHeader = algo === 'bayes' ? T.header_post_prob : T.header_score;
  const scoreTooltip = algo === 'bayes' ? T.tooltip_post : T.tooltip_score;
  
  const numSelected = comparisonList.length;
  const rowCount = rows.length;
  const isAllSelected = rowCount > 0 && numSelected === rowCount;

  return (
    <>
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">{title || STR[lang].panels.candidates}</Typography>
            <Chip label={`${rows?.length ?? 0} / ${totalTaxa}`} size="small" />
            <FormControlLabel 
                control={<Switch size="small" checked={showMatchSupport} onChange={e => setShowMatchSupport(e.target.checked)}/>}
                label={<Typography variant="body2">{T.show_match_support}</Typography>}
                sx={{ ml: 1 }}
            />
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
              <TableCell padding="checkbox">
                <Tooltip title={isAllSelected ? "Deselect All" : "Select All"}>
                  <Checkbox
                      indeterminate={numSelected > 0 && numSelected < rowCount}
                      checked={isAllSelected}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all candidates' }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell sx={{ width: 50 }}>{T.header_rank}</TableCell>
              <TableCell>{T.header_name}</TableCell>
              <TableCell sx={{ width: 120 }}><Tooltip title={scoreTooltip}><span>{scoreHeader}</span></Tooltip></TableCell>
              <TableCell sx={{ width: 80 }}><Tooltip title={T.tooltip_delta}><span>{T.header_delta}</span></Tooltip></TableCell>
              <TableCell sx={{ width: 70 }} align="center"><Tooltip title={<Typography sx={{whiteSpace: 'pre-line'}}>{T.tooltip_conflicts}</Typography>}><span>{T.header_conflicts}</span></Tooltip></TableCell>
              {showMatchSupport && <TableCell sx={{ width: 110 }}><Tooltip title={<Typography sx={{whiteSpace: 'pre-line'}}>{T.tooltip_match_support}</Typography>}><span>{T.header_match_support}</span></Tooltip></TableCell>}
              <TableCell sx={{ width: 50 }} align="center">Why?</TableCell>
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
                onClick={() => onTaxonSelect(r.taxon)}
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: (r.conflicts ?? 0) > 0 ? 'rgba(255, 170, 170, 0.1)' : 'transparent' 
                }}
              >
                <TableCell padding="checkbox" onClick={(e) => { e.stopPropagation(); handleCompareChange(taxonId, !isChecked); }}>
                    <Checkbox
                        size="small"
                        checked={isChecked}
                        disabled={!taxonId}
                    />
                </TableCell>
                <TableCell>{r.rank ?? i + 1}</TableCell>
                <TableCell>
                  <FormattedScientificName taxon={r.taxon} lang={lang} />
                </TableCell>
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
                <TableCell align="center">
                    <Tooltip title={`Why is ${r.taxon?.name} ranked here?`}>
                        <span>
                        <IconButton size="small" onClick={(e) => handleWhyClick(e, r.taxon)} disabled={!selected || Object.keys(selected).length === 0 && Object.keys(selectedMulti).length === 0}>
                            <HelpOutlineIcon fontSize="small"/>
                        </IconButton>
                        </span>
                    </Tooltip>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
    <Modal open={justificationOpen} onClose={() => setJustificationOpen(false)}>
        <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80vw',
            maxWidth: '1200px',
            maxHeight: '85vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <JustificationPanel
                taxon={currentTargetTaxon}
                justification={currentJustification}
                loading={loadingJustification}
                onClose={() => setJustificationOpen(false)}
                lang={lang}
            />
        </Box>
    </Modal>
    </>
  );
}