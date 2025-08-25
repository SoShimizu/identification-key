import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Grid
} from '@mui/material';
import { RichTextEditor } from '../common/RichTextEditor'; // Correctly import RichTextEditor

interface Props {
  open: boolean;
  onClose: () => void;
  matrixInfo: string[][];
  onSave: (newMatrixInfo: string[][]) => void;
};

export default function MatrixInfoEditorDialog({ open, onClose, matrixInfo, onSave }: Props) {
  const [info, setInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && matrixInfo) {
      const infoObject = matrixInfo.reduce((acc, row) => {
        if (row && row.length >= 2) {
          acc[row[0]] = row[1];
        }
        return acc;
      }, {} as Record<string, string>);
      setInfo(infoObject);
    }
  }, [open, matrixInfo]);

  const handleFieldChange = (key: string, value: string) => {
    setInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    const keyOrder = matrixInfo.map(row => row[0]).filter(Boolean);
    for (const key in info) {
        if (!keyOrder.includes(key)) {
            keyOrder.push(key);
        }
    }
    
    const newMatrixInfo: string[][] = keyOrder
        .filter(key => info[key] !== undefined)
        .map(key => [key, info[key] === '<p><br></p>' ? '' : info[key]]); // Convert Quill's empty value to an empty string

    onSave(newMatrixInfo);
    onClose();
  };

  const fields = [
    { key: 'title_en', label: 'Title (English)', half: true, rich: true, height: 40 },
    { key: 'title_jp', label: 'Title (Japanese)', half: true, rich: true, height: 40 },
    { key: 'version', label: 'Version', half: true },
    { key: 'authors_en', label: 'Authors (English)', half: true },
    { key: 'authors_jp', label: 'Authors (Japanese)', half: true },
    { key: 'citation_en', label: 'Citation (English)', rich: true, height: 80 },
    { key: 'citation_jp', label: 'Citation (Japanese)', rich: true, height: 80 },
    { key: 'description_en', label: 'Description (English)', rich: true, height: 150 },
    { key: 'description_jp', label: 'Description (Japanese)', rich: true, height: 150 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Matrix Metadata</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {fields.map(field => (
              <Grid item xs={12} sm={field.half ? 6 : 12} key={field.key}>
                {field.rich ? (
                  <RichTextEditor
                    label={field.label}
                    value={info[field.key] || ''}
                    onValueChange={(value) => handleFieldChange(field.key, value)}
                    height={field.height}
                  />
                ) : (
                  <TextField
                    label={field.label}
                    value={info[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    variant="outlined"
                    fullWidth
                    size="small"
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}