import React from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface MatrixToolbarProps {
  matrixList: string[];
  selectedMatrix: string;
  onSelectMatrix: (name: string) => void;
  onNewMatrix: () => void;
  onSaveMatrix: () => void;
  isSaveDisabled: boolean;
  // --- 以下を追加 ---
  keysDirectory: string;
  onChangeDirectory: () => void;
}

export const MatrixToolbar: React.FC<MatrixToolbarProps> = ({
  matrixList,
  selectedMatrix,
  onSelectMatrix,
  onNewMatrix,
  onSaveMatrix,
  isSaveDisabled,
  // --- 以下を追加 ---
  keysDirectory,
  onChangeDirectory,
}) => {
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    onSelectMatrix(event.target.value);
  };

  return (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onNewMatrix}>
                New Matrix
            </Button>

            <FormControl sx={{ m: 1, minWidth: 240 }} size="small">
                <InputLabel id="select-matrix-label">Load Matrix</InputLabel>
                <Select
                labelId="select-matrix-label"
                id="select-matrix"
                value={selectedMatrix}
                label="Load Matrix"
                onChange={handleSelectChange}
                >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                {matrixList.map((name) => (
                    <MenuItem key={name} value={name}>
                    {name}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={onSaveMatrix} disabled={isSaveDisabled}>
                Save Changes
            </Button>
        </Box>
        {/* --- ここから下を全て追加 --- */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'action.hover' }}>
            <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                Matrix Directory:
            </Typography>
            <Tooltip title={keysDirectory}>
                <Typography variant="body2" sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'background.default',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '400px',
                }}>
                    {keysDirectory}
                </Typography>
            </Tooltip>
            <Tooltip title="Change Directory">
                <IconButton onClick={onChangeDirectory} size="small">
                    <FolderOpenIcon />
                </IconButton>
            </Tooltip>
        </Box>
    </Box>
  );
};