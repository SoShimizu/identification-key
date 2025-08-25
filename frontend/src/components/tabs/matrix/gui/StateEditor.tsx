import React, { useState, useMemo } from 'react';
import { Box, Typography, TextField, Autocomplete, Alert, Collapse, ListItemButton, ListItemText, List, ListSubheader } from '@mui/material';
import { TaxonInfoItem, TraitInfoItem, groupTraits, getStateValue } from '../matrixUtils';
import { MatrixData } from '../../../../types';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

interface StateEditorProps {
  selectedTaxon: TaxonInfoItem;
  allTraits: TraitInfoItem[];
  matrixData: MatrixData;
  onStateChange: (traitRowIndex: number, taxonColIndex: number, newValue: string) => void;
}

export const StateEditor: React.FC<StateEditorProps> = ({ selectedTaxon, allTraits, matrixData, onStateChange }) => {
  const groupedTraits = useMemo(() => groupTraits(allTraits), [allTraits]);
  const sortedGroupNames = useMemo(() => Array.from(groupedTraits.keys()).sort(), [groupedTraits]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(sortedGroupNames)); // 最初は全て開いておく

  const handleGroupClick = (groupName: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName);
    } else {
      newOpenGroups.add(groupName);
    }
    setOpenGroups(newOpenGroups);
  };
  
  const renderTraitInput = (trait: TraitInfoItem) => {
    const { value, colIndex } = getStateValue(matrixData.traits, trait.rowIndex, selectedTaxon.id);
    if (colIndex === -1) return <Typography color="error">Taxon column not found!</Typography>;

    const traitsHeader = matrixData.traits[0] || [];
    const typeColIndex = traitsHeader.findIndex(h => h.trim() === '#Type');
    const allowedValuesIndex = traitsHeader.findIndex(h => h.trim() === '#AllowedValues');
    const type = typeColIndex !== -1 ? trait.rowData[typeColIndex] : '';
    const allowedValuesStr = allowedValuesIndex !== -1 ? trait.rowData[allowedValuesIndex] : '';

    const handleValueChange = (newValue: string) => {
        onStateChange(trait.rowIndex, colIndex, newValue);
    };

    if (type.startsWith('categorical') && allowedValuesStr) {
      const options = allowedValuesStr.split(',').map(s => s.trim()).filter(Boolean);
      const isMulti = type.includes('multi');
      const currentValueParts = value.split(';').map(s => s.trim()).filter(Boolean);
      const hasInvalidValue = currentValueParts.some(part => !options.includes(part));

      return (
        <>
            <Autocomplete
                multiple={isMulti}
                options={options}
                value={isMulti ? currentValueParts : value}
                onChange={(event, newValue) => {
                    handleValueChange(Array.isArray(newValue) ? newValue.join(';') : newValue || '');
                }}
                freeSolo={!isMulti}
                renderInput={(params) => <TextField {...params} label={trait.name} size="small" />}
                />
            {hasInvalidValue && <Alert severity="warning" sx={{mt: 1, fontSize: '0.8rem', p: '0 8px'}}>Current value "{value}" is not in the allowed choices.</Alert>}
        </>
      );
    }
    
    return (
      <TextField
        label={trait.name} value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        fullWidth size="small" variant="outlined"
      />
    );
  };

  return (
    <List sx={{p:0}}>
      {sortedGroupNames.map(groupName => (
        <React.Fragment key={groupName}>
          <ListItemButton onClick={() => handleGroupClick(groupName)}>
            <ListItemText primary={groupName} primaryTypographyProps={{ fontWeight: 'bold', color: 'text.secondary' }} />
            {openGroups.has(groupName) ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openGroups.has(groupName)} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 1, pt: 1, pb: 2, display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              {groupedTraits.get(groupName)?.map(trait => (
                <Box key={trait.id}>
                  {renderTraitInput(trait)}
                </Box>
              ))}
            </Box>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};