import React from 'react';
import { Box, TextField, Typography, Grid } from '@mui/material';

interface TaxonEditorFormProps {
  header: string[];
  rowData: string[];
  onRowChange: (newRowData: string[]) => void;
}

export const TaxonEditorForm: React.FC<TaxonEditorFormProps> = ({ header, rowData, onRowChange }) => {
  
  const handleChange = (index: number, value: string) => {
    const newRowData = [...rowData];
    newRowData[index] = value;
    onRowChange(newRowData);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Edit Taxon Definition
      </Typography>
      <Grid container spacing={2}>
        {header.map((colName, index) => (
          <Grid item xs={12} sm={6} key={`${colName}-${index}`}>
            <TextField
              label={colName || `Column ${index + 1}`}
              value={rowData[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              variant="outlined"
              fullWidth
              size="small"
              // TaxonIDは重要なキーなので、少しスタイルを変える
              sx={colName === '#TaxonID' ? { backgroundColor: 'action.focus' } : {}}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};