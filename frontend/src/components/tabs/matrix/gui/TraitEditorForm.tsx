import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Paper, FormLabel, RadioGroup, FormControlLabel, Radio, Divider, ListSubheader, Button, Chip } from '@mui/material';
import { getUniqueTraitStates, groupTraits, TraitInfoItem } from '../matrixUtils';
import { MatrixData } from '../../../../types';
import { ChoiceListEditor } from './ChoiceListEditor';
import { ImageSelectorModal } from './ImageSelectorModal';

interface TraitEditorFormProps {
  allTaxonIDs: Set<string>;
  allTraits: TraitInfoItem[];
  header: string[];
  rowData: string[];
  onRowChange: (newRowData: string[]) => void;
  matrixData: MatrixData;
  traitRowIndex: number;
}

const traitTypeOptions = ['categorical', 'categorical_multi', 'continuous', 'nominal', 'meristic', 'binary'];
const difficultyOptions = ['Easy', 'Normal', 'Hard'];
const riskOptions = ['Low', 'Medium', 'High'];

export const TraitEditorForm: React.FC<TraitEditorFormProps> = (props) => {
  const { allTaxonIDs, allTraits, header, rowData, onRowChange, matrixData, traitRowIndex } = props;
  
  const [inputMethod, setInputMethod] = useState<'free' | 'list'>('free');
  const [choices, setChoices] = useState<string[]>([]);
  const [isImageSelectorOpen, setImageSelectorOpen] = useState(false);
  
  const groupedTraits = React.useMemo(() => groupTraits(allTraits), [allTraits]);
  const sortedGroupNames = React.useMemo(() => Array.from(groupedTraits.keys()).sort(), [groupedTraits]);
  
  const colIndices = React.useMemo(() => ({
      id: header.findIndex(h => h.trim() === '#TraitID'),
      dependency: header.findIndex(h => h.trim() === '#Dependency'),
      type: header.findIndex(h => h.trim() === '#Type'),
      difficulty: header.findIndex(h => h.trim() === '#Difficulty'),
      risk: header.findIndex(h => h.trim() === '#Risk'),
      helpText: header.findIndex(h => h.trim() === 'HelpText_en'),
      helpImages: header.findIndex(h => h.trim() === '#HelpImages'),
      allowedValues: header.findIndex(h => h.trim() === '#AllowedValues'),
  }), [header]);

  useEffect(() => {
    if (colIndices.allowedValues !== -1 && rowData[colIndices.allowedValues]) {
      setInputMethod('list');
      setChoices(rowData[colIndices.allowedValues].split(',').map(s => s.trim()).filter(Boolean));
    } else {
      const autoChoices = getUniqueTraitStates(matrixData, traitRowIndex, allTaxonIDs);
      if (autoChoices.length > 0) {
        setInputMethod('list');
        setChoices(autoChoices);
      } else {
        setInputMethod('free');
        setChoices([]);
      }
    }
  }, [rowData, colIndices.allowedValues, matrixData, traitRowIndex, allTaxonIDs]);

  const handleChange = (index: number, value: string) => {
    if (index === -1) return;
    const newRowData = [...rowData];
    while(newRowData.length <= index) { newRowData.push(''); }
    newRowData[index] = value;
    onRowChange(newRowData);
  };
  
  const handleInputMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMethod = event.target.value as 'free' | 'list';
    setInputMethod(newMethod);
    if (newMethod === 'free') handleChoicesChange([]);
  };

  const handleChoicesChange = (newChoices: string[]) => {
    setChoices(newChoices);
    if (colIndices.allowedValues !== -1) {
        handleChange(colIndices.allowedValues, newChoices.join(','));
    } else {
        console.warn("#AllowedValues column not found in Traits sheet.");
    }
  };

  const handleImageSave = (newSelection: string[]) => {
    if (colIndices.helpImages !== -1) {
        handleChange(colIndices.helpImages, newSelection.join(','));
    }
  };

  const currentType = colIndices.type !== -1 ? rowData[colIndices.type] : '';
  const selectedImages = colIndices.helpImages !== -1 && rowData[colIndices.helpImages] ? rowData[colIndices.helpImages].split(',').filter(Boolean) : [];

  const definitionColumns = header
    .map((colName, index) => ({ colName, index }))
    .filter(({ colName }) => !allTaxonIDs.has(colName.trim()));
  
  const renderField = (colName: string, index: number) => {
      switch (index) {
          case colIndices.dependency:
              return <FormControl fullWidth size="small"><InputLabel>{colName}</InputLabel><Select label={colName} value={rowData[index] || ''} onChange={(e) => handleChange(index, e.target.value)}><MenuItem value=""><em>None</em></MenuItem>{sortedGroupNames.map(group => { const items = groupedTraits.get(group)!.map(trait => <MenuItem key={trait.id} value={trait.id}>{trait.name}</MenuItem>); return [<ListSubheader key={group}>{group}</ListSubheader>, ...items]; })}</Select></FormControl>;
          case colIndices.type:
              return <FormControl fullWidth size="small"><InputLabel>{colName}</InputLabel><Select label={colName} value={currentType} onChange={(e) => handleChange(index, e.target.value)}>{traitTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>;
          case colIndices.difficulty:
              return <FormControl fullWidth size="small"><InputLabel>{colName}</InputLabel><Select label={colName} value={rowData[index] || ''} onChange={(e) => handleChange(index, e.target.value)}>{difficultyOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>;
          case colIndices.risk:
              return <FormControl fullWidth size="small"><InputLabel>{colName}</InputLabel><Select label={colName} value={rowData[index] || ''} onChange={(e) => handleChange(index, e.target.value)}>{riskOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>;
          case colIndices.helpText:
              return <TextField label={colName} value={rowData[index] || ''} onChange={(e) => handleChange(index, e.target.value)} multiline rows={3} fullWidth size="small" />;
          case colIndices.helpImages:
              return <Box><Typography variant="subtitle2" color="text.secondary" gutterBottom>{colName}</Typography><Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center'}}>{selectedImages.map(img => <Chip key={img} label={img} size="small" onDelete={() => handleImageSave(selectedImages.filter(i => i !== img))}/>)}<Button onClick={() => setImageSelectorOpen(true)} size="small" variant="outlined">Select Images</Button></Box></Box>;
          case colIndices.allowedValues:
              return null;
          default:
              return <TextField label={colName} value={rowData[index] || ''} onChange={(e) => handleChange(index, e.target.value)} fullWidth size="small" disabled={index === colIndices.id} sx={index === colIndices.id ? { backgroundColor: 'action.disabledBackground' } : {}} />;
      }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Edit Trait Definition</Typography>
      <Grid container spacing={2}>
        {definitionColumns.map(({ colName, index }) => (
            <Grid item xs={(index === colIndices.helpText || index === colIndices.helpImages) ? 12 : 6} key={`${colName}-${index}`}>
                {renderField(colName, index)}
            </Grid>
        ))}
      </Grid>
      
      {(currentType === 'binary' || currentType === 'nominal' || currentType === 'categorical' || currentType === 'categorical_multi') && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Input Rules for "{currentType}" Type</Typography><Divider sx={{mb: 2}}/>
            {currentType === 'binary' && <FormControl><FormLabel>Binary Format</FormLabel><RadioGroup row defaultValue="0/1"><FormControlLabel value="0/1" control={<Radio/>} label="0/1"/><FormControlLabel value="y/n" control={<Radio/>} label="Yes/No"/></RadioGroup></FormControl>}
            {(currentType === 'nominal' || currentType === 'categorical' || currentType === 'categorical_multi') && <Box><FormControl sx={{mb: 2}}><FormLabel>Input Method</FormLabel><RadioGroup row value={inputMethod} onChange={handleInputMethodChange}><FormControlLabel value="free" control={<Radio/>} label="Free Input"/><FormControlLabel value="list" control={<Radio/>} label="Choice List"/></RadioGroup></FormControl>{inputMethod === 'list' && <ChoiceListEditor choices={choices} onChoicesChange={handleChoicesChange}/>}</Box>}
        </Paper>
      )}

      <ImageSelectorModal open={isImageSelectorOpen} onClose={() => setImageSelectorOpen(false)} initialSelection={selectedImages} onSave={handleImageSave} />
    </Box>
  );
};