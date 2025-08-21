// frontend/src/components/panels/traits/TraitsPanel.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Paper, Box, Typography, Stack, Button, ButtonGroup, Chip, Table, TableHead,
  TableRow, TableCell, TableContainer, Tooltip,
  TableBody, Slider, TextField, IconButton, FormGroup, FormControlLabel, Checkbox, Popover
} from "@mui/material";
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { STR } from "../../../i18n";
import { Trait, TraitSuggestion, MultiChoice } from "../../../api";


export type TraitRow =
  | { group: string; traitName: string; type: "binary"; binary: Trait }
  | { group: string; traitName: string; type: "derived"; children: { id: string; label: string }[]; parentTrait: Trait }
  | { group: string; traitName: string; type: "continuous"; continuous: Trait }
  | { group: string; traitName: string; type: "categorical_multi"; multi: Trait };

type Props = {
  mode: "unselected" | "selected";
  rows: TraitRow[];
  selected: Record<string, number>;
  selectedMulti: Record<string, MultiChoice>;
  setBinary: (traitId: string, val: number, label: string) => void;
  setContinuous: (traitId: string, val: number | null, label: string) => void;
  setMulti: (traitId: string, values: MultiChoice, label: string) => void;
  setDerivedPick: (childrenIds: string[], chosenId: string, parentLabel: string) => void;
  clearDerived: (childrenIds: string[], parentLabel?: string, asNA?: boolean) => void;
  sortBy: "recommend" | "group" | "name";
  suggMap: Record<string, TraitSuggestion>;
  onTraitSelect: (trait?: Trait) => void;
  lang?: "ja" | "en";
};

// getRowSuggestion, ScoreBarは変更なし
function getRowSuggestion(row: TraitRow, suggMap: Record<string, TraitSuggestion>): TraitSuggestion | undefined {
    if (row.type === "binary") return suggMap[row.binary.id];
    if (row.type === "continuous") return suggMap[row.continuous.id];
    if (row.type === "categorical_multi") return suggMap[row.multi.id];
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


const ContinuousInput = ({ trait, selectedValue, onApply }: { trait: Trait, selectedValue: number | undefined, onApply: (val: number | null) => void }) => {
    const [localValue, setLocalValue] = useState<number | string>(selectedValue ?? "");
    const min = trait.minValue ?? 0;
    const max = trait.maxValue ?? 100;
    const isInteger = trait.isInteger ?? false;
    const step = isInteger ? 1 : parseFloat(((max - min) / 100).toPrecision(2));

    useEffect(() => { setLocalValue(selectedValue ?? ""); }, [selectedValue]);

    const handleApply = () => {
        let num = typeof localValue === 'string' ? parseFloat(localValue) : localValue;
        if (!isNaN(num)) {
            if (isInteger) num = Math.round(num);
            onApply(num);
        }
    };

    const handleClear = () => { setLocalValue(""); onApply(null); };

    return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>{min.toFixed(isInteger ? 0 : 1)}</Typography>
            <Slider value={typeof localValue === 'number' ? localValue : min} onChange={(_, v) => setLocalValue(v as number)} min={min} max={max} step={step} valueLabelDisplay="off" />
            <Typography variant="body2" sx={{ minWidth: 40, fontFamily: 'monospace' }}>{max.toFixed(isInteger ? 0 : 1)}</Typography>
            <TextField value={localValue} onChange={(e) => setLocalValue(e.target.value)} size="small" variant="outlined" inputProps={{ step, min, max, type: 'number' }} sx={{ width: 110, minWidth: 110 }} />
            <Tooltip title="値を設定"><span><IconButton size="small" color="primary" onClick={handleApply}><CheckCircleOutlineIcon /></IconButton></span></Tooltip>
            <Tooltip title="値をクリア"><span><IconButton size="small" onClick={handleClear} disabled={selectedValue === undefined}><ClearIcon /></IconButton></span></Tooltip>
        </Stack>
    );
};

// New component for multi-categorical traits
const MultiChoiceInput = ({ trait, selectedValues, onApply, lang = "ja" }: { trait: Trait, selectedValues: MultiChoice, onApply: (values: MultiChoice) => void, lang?: "ja" | "en" }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [localSelection, setLocalSelection] = useState<MultiChoice>(selectedValues);
    const T = STR[lang].traitsPanel;

    useEffect(() => {
        setLocalSelection(selectedValues);
    }, [selectedValues]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setLocalSelection(selectedValues); // Open popover with the current global state
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        const newValues = checked ? [...localSelection, name] : localSelection.filter(v => v !== name);
        setLocalSelection(newValues);
    };

    const handleApply = () => {
        onApply(localSelection);
        handleClose();
    };
    
    const handleClear = () => {
        setLocalSelection([]);
        onApply([]);
        handleClose();
    }

    const open = Boolean(anchorEl);
    const id = open ? `popover-${trait.id}` : undefined;

    return (
        <Box onClick={(e) => e.stopPropagation()}>
            <Tooltip title={T.multi_select_tooltip}>
                <Button aria-describedby={id} variant="outlined" size="small" onClick={handleClick}>
                    {selectedValues.length > 0 ? `${selectedValues.length} selected` : "Select States"}
                </Button>
            </Tooltip>
            <Popover id={id} open={open} anchorEl={anchorEl} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <Paper sx={{ p: 2, maxHeight: 400, overflowY: 'auto', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>{T.multi_select_tooltip}</Typography>
                    <FormGroup>
                        {(trait.states || []).map(state => (
                            <FormControlLabel
                                key={state}
                                control={<Checkbox size="small" checked={localSelection.includes(state)} onChange={handleChange} name={state} />}
                                label={<Typography variant="body2">{state}</Typography>}
                            />
                        ))}
                    </FormGroup>
                    <Stack direction="row" spacing={1} mt={2}>
                        <Button size="small" variant="outlined" onClick={handleClear}>{T.state_clear}</Button>
                        <Button size="small" variant="contained" onClick={handleApply}>{T.apply_selection}</Button>
                    </Stack>
                </Paper>
            </Popover>
        </Box>
    );
};


const RowRenderer = React.memo(({ r, selected, selectedMulti, setBinary, setContinuous, setMulti, setDerivedPick, clearDerived, rank, suggestion, onTraitSelect, lang = "ja" }: {
  r: TraitRow;
  selected: Record<string, number>;
  selectedMulti: Record<string, MultiChoice>;
  setBinary: Props["setBinary"];
  setContinuous: Props["setContinuous"];
  setMulti: Props["setMulti"];
  setDerivedPick: Props["setDerivedPick"];
  clearDerived: Props["clearDerived"];
  rank?: number;
  suggestion?: TraitSuggestion;
  onTraitSelect: (trait?: Trait) => void;
  lang?: "ja" | "en";
}) => {
  const T = STR[lang].traitsPanel;
  const chosenId = r.type === 'derived' ? r.children.find(c => selected[c.id] === 1)?.id : undefined;

  const traitObject = r.type === 'binary' ? r.binary : r.type === 'continuous' ? r.continuous : r.type === 'categorical_multi' ? r.multi : r.parentTrait;
  const hasHelpText = traitObject.helpText && traitObject.helpText.trim() !== "";
  const hasHelpImages = traitObject.helpImages && traitObject.helpImages.length > 0;

  return (
    <TableRow hover onClick={() => onTraitSelect(traitObject)} sx={{ cursor: 'pointer' }}>
      <TableCell align="center">{typeof rank === "number" ? <Chip size="small" label={`#${rank}`} /> : "—"}</TableCell>
      <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{suggestion ? suggestion.score.toFixed(3) : "—"}</Typography><ScoreBar suggestion={suggestion} /></TableCell>
      <TableCell>{r.group}</TableCell>
      <TableCell>{r.traitName}</TableCell>
      <TableCell><Stack direction="row" spacing={0.5}>{hasHelpText && <DescriptionIcon fontSize="small" color="action" />}{hasHelpImages && <ImageIcon fontSize="small" color="action" />}</Stack></TableCell>
      <TableCell sx={{ py: 0.5 }}>
        {r.type === "binary" ? (
             <ButtonGroup variant="outlined" size="small" onClick={(e) => e.stopPropagation()}>
                <Button variant={selected[r.binary.id] === 1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, 1, r.traitName)}>{T.state_yes}</Button>
                <Button variant={selected[r.binary.id] === -1 ? 'contained' : 'outlined'} onClick={() => setBinary(r.binary.id, -1, r.traitName)}>{T.state_no}</Button>
                <Tooltip title={T.tooltip_na}><Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>{T.state_na}</Button></Tooltip>
                <Tooltip title={T.tooltip_clear}><Button onClick={() => setBinary(r.binary.id, 0, r.traitName)}>{T.state_clear}</Button></Tooltip>
            </ButtonGroup>
        ) : r.type === "continuous" ? (
            <ContinuousInput trait={r.continuous} selectedValue={selected[r.continuous.id]} onApply={(val) => setContinuous(r.continuous.id, val, r.traitName)} />
        ) : r.type === "categorical_multi" ? (
            <MultiChoiceInput trait={r.multi} selectedValues={selectedMulti[r.multi.id] || []} onApply={(values) => setMulti(r.multi.id, values, r.traitName)} lang={lang} />
        ) : ( // derived
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                {r.children.map(c => (<Button key={c.id} size="small" variant={chosenId === c.id ? 'contained' : 'outlined'} onClick={() => setDerivedPick(r.children.map(x => x.id), c.id, r.traitName)}>{c.label}</Button>))}
                <Button size="small" variant="outlined" onClick={() => clearDerived(r.children.map(x => x.id), r.traitName, false)}>{T.state_clear}</Button>
            </Stack>
        )}
      </TableCell>
    </TableRow>
  );
});

// TraitsPanel本体
export default function TraitsPanel(props: Props) {
  const { mode, rows, selected, selectedMulti, setBinary, setContinuous, setMulti, setDerivedPick, clearDerived, sortBy, suggMap, onTraitSelect, lang = "ja" } = props;

  const filteredAndSortedRows = useMemo(() => {
    const filtered = rows.filter(r => {
        if (r.type === 'binary') return mode === 'selected' ? (selected[r.binary.id] !== undefined && selected[r.binary.id] !== 0) : (selected[r.binary.id] === undefined || selected[r.binary.id] === 0);
        if (r.type === 'continuous') return mode === 'selected' ? selected[r.continuous.id] !== undefined : selected[r.continuous.id] === undefined;
        if (r.type === 'categorical_multi') return mode === 'selected' ? (selectedMulti[r.multi.id] !== undefined && selectedMulti[r.multi.id].length > 0) : (selectedMulti[r.multi.id] === undefined || selectedMulti[r.multi.id].length === 0);
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
  }, [rows, mode, selected, selectedMulti, sortBy, suggMap]);

  const localSuggRank = useMemo(() => {
    if (sortBy !== 'recommend') return {};
    const rank: Record<string, number> = {};
    filteredAndSortedRows.forEach((row, i) => {
        const sugg = getRowSuggestion(row, suggMap);
        if (sugg) rank[sugg.traitId] = i + 1;
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
              <TableCell sx={{ minWidth: 500 }}>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRows.map((r) => {
                const suggestion = getRowSuggestion(r, suggMap);
              return (<RowRenderer
                key={r.type === 'binary' ? r.binary.id : r.type === 'continuous' ? r.continuous.id : r.type === 'categorical_multi' ? r.multi.id : r.traitName}
                r={r}
                selected={selected}
                selectedMulti={selectedMulti}
                setBinary={setBinary}
                setContinuous={setContinuous}
                setMulti={setMulti}
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