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

type Props = {
  lang: "ja" | "en";
  allTraits: Trait[];
  allTaxa: Taxon[];
  comparisonList: string[];
  onClose: () => void;
};

// ✨ バグを修正し、より堅牢にしたヘルパー関数
const getTraitState = (taxon: Taxon, trait: Trait, allTraits: Trait[]): string => {
    // 1. Binary trait:単純なYes/No/NAを返す
    if (trait.type === 'binary') {
        const state = taxon.traits?.[trait.id];
        switch (state) {
            case 1: return "Yes";
            case -1: return "No";
            default: return "NA";
        }
    }

    // 2. Parent trait (nominal or ordinal): 派生形質から状態名を探す
    if (trait.type === 'nominal_parent') {
        // この親形質に属するすべての子（derived）形質を探す
        const childTraits = allTraits.filter(t => t.parent === trait.name);
        
        // タクソンのデータを見て、どの子形質が 'Yes' (1) になっているか探す
        for (const child of childTraits) {
            if (taxon.traits?.[child.id] === 1) {
                return child.state || child.name; // 'orange', 'small' などの状態名を返す
            }
        }
    }
    
    // 該当する状態が見つからなければNA
    return "NA";
};

export default function ComparisonPanel({ lang, allTraits, allTaxa, comparisonList, onClose }: Props) {
  const T = STR[lang].comparisonPanel;
  const [hideSame, setHideSame] = useState(true);

  const comparedTaxa = useMemo(() => {
    return allTaxa.filter(t => comparisonList.includes(t.id));
  }, [allTaxa, comparisonList]);

  const displayTraits = useMemo(() => {
    // 派生形質（derived）を除き、ユーザーが直接選択する可能性のある親形質のみを表示対象とする
    const userSelectableTraits = allTraits.filter(t => t.type !== 'derived');

    if (!hideSame || comparedTaxa.length < 2) {
        return userSelectableTraits;
    }

    // 違いのある形質のみをフィルタリング
    return userSelectableTraits.filter(trait => {
        const firstState = getTraitState(comparedTaxa[0], trait, allTraits);
        for (let i = 1; i < comparedTaxa.length; i++) {
            if (getTraitState(comparedTaxa[i], trait, allTraits) !== firstState) {
                return true; // 違いが見つかった
            }
        }
        return false; // すべて同じだった
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
                <TableCell key={taxon.id} sx={{ fontWeight: 'bold', minWidth: 150 }}>{taxon.name}</TableCell>
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
                            <Typography variant="caption" color="text.secondary">{trait.group}</Typography>
                            <Typography variant="body2">{trait.name}</Typography>
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