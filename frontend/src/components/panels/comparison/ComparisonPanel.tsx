// frontend/src/components/panels/comparison/ComparisonPanel.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Trait, Taxon } from "../../../api";
import { STR } from "../../../i18n";
import { FormattedTaxonName } from "../../common/FormattedTaxonName";

type Props = {
  lang: "ja" | "en";
  allTraits: Trait[];
  allTaxa: Taxon[];
  comparisonList: string[];
  onClose: () => void;
};

const getTraitState = (taxon: Taxon, trait: Trait, allTraits: Trait[]): string => {
    if (trait.type === 'binary') {
        const state = taxon.traits?.[trait.id];
        switch (state) {
            case 1: return "Yes";
            case -1: return "No";
            default: return "NA";
        }
    }

    if (trait.type === 'nominal_parent') {
        const childTraits = allTraits.filter(t => t.parent === trait.traitId);
        
        for (const child of childTraits) {
            if (taxon.traits?.[child.id] === 1) {
                return child.state || child.name_en; 
            }
        }
    }
    
    return "NA";
};

export default function ComparisonPanel({ lang, allTraits, allTaxa, comparisonList, onClose }: Props) {
  const T = STR[lang].comparisonPanel;
  const [hideSame, setHideSame] = useState(true);

  const comparedTaxa = useMemo(() => {
    return allTaxa.filter(t => comparisonList.includes(t.id));
  }, [allTaxa, comparisonList]);

  const displayTraits = useMemo(() => {
    const userSelectableTraits = allTraits.filter(t => t.type !== 'derived');

    if (!hideSame || comparedTaxa.length < 2) {
        return userSelectableTraits;
    }

    return userSelectableTraits.filter(trait => {
        const firstState = getTraitState(comparedTaxa[0], trait, allTraits);
        for (let i = 1; i < comparedTaxa.length; i++) {
            if (getTraitState(comparedTaxa[i], trait, allTraits) !== firstState) {
                return true;
            }
        }
        return false;
    });
  }, [allTraits, comparedTaxa, hideSame]);

  if (comparedTaxa.length < 2) {
    return (
        <Box sx={{p: 3, textAlign: 'center'}}>
            <IconButton onClick={onClose} sx={{position: 'absolute', top: 8, right: 8}}><CloseIcon /></IconButton>
            <Typography variant="h6">{T.title}</Typography>
            <Typography color="text.secondary">{T.select_prompt}</Typography>
        </Box>
    );
  }

  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexShrink: 0 }}>
        <Typography variant="h6">{T.title}</Typography>
        <Stack direction="row" alignItems="center">
            <FormControlLabel
                control={<Switch checked={hideSame} onChange={(e) => setHideSame(e.target.checked)} />}
                label={<Typography variant="body2">{T.hide_same_traits}</Typography>}
            />
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
      </Stack>
      <TableContainer component={Box} sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>{T.trait}</TableCell>
              {comparedTaxa.map(taxon => (
                <TableCell key={taxon.id} sx={{ fontWeight: 'bold', minWidth: 150 }}>
                    <FormattedTaxonName taxon={taxon} lang={lang} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayTraits.map(trait => {
                const states = comparedTaxa.map(taxon => getTraitState(taxon, trait, allTraits));
                const areDifferent = new Set(states).size > 1;

                return (
                    <TableRow key={trait.id} sx={{ bgcolor: areDifferent ? 'action.hover' : 'transparent' }}>
                        <TableCell component="th" scope="row">
                            <Typography variant="caption" color="text.secondary">{lang === 'ja' ? trait.group_jp || trait.group_en : trait.group_en || trait.group_jp}</Typography>
                            <Typography variant="body2">{lang === 'ja' ? trait.name_jp || trait.name_en : trait.name_en || trait.name_jp}</Typography>
                        </TableCell>
                        {comparedTaxa.map((taxon, index) => (
                        <TableCell key={taxon.id}>
                            {states[index]}
                        </TableCell>
                        ))}
                    </TableRow>
                );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}