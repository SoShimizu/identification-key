import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { CsvFileType } from '../../../types'; // types.ts は後で修正

interface MatrixFileTreeProps {
  selectedFile: CsvFileType;
  onSelectFile: (fileType: CsvFileType) => void;
}

const fileTypes: CsvFileType[] = ['MatrixInfo', 'TaxaInfo', 'Traits'];

export const MatrixFileTree: React.FC<MatrixFileTreeProps> = ({ selectedFile, onSelectFile }) => {
  return (
    <Box sx={{ width: '100%', borderRight: 1, borderColor: 'divider', height: '100%' }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Matrix Files
      </Typography>
      <List>
        {fileTypes.map((fileType) => (
          <ListItem key={fileType} disablePadding>
            <ListItemButton selected={selectedFile === fileType} onClick={() => onSelectFile(fileType)}>
              <ListItemText primary={`${fileType}.csv`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};