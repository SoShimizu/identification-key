// frontend/src/components/tabs/matrix/MatrixEditor.tsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { MatrixToolbar } from './MatrixToolbar';
import { MatrixFileTree } from './MatrixFileTree';
import { MatrixDataGrid } from './MatrixDataGrid';
import { CsvFileType, MatrixData } from '../../../types';
import * as api from '../../../../wailsjs/go/main/App';
import { GuiEditor } from './gui/GuiEditor';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridOnIcon from '@mui/icons-material/GridOn';

interface MatrixEditorProps {
    selectedMatrix: string;
    matrixData: MatrixData | null;
    onDataChange: (data: MatrixData) => void;
    isLoading: boolean;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({ selectedMatrix, matrixData, onDataChange, isLoading }) => {
  const [originalMatrixData, setOriginalMatrixData] = useState<MatrixData | null>(null);
  const [selectedFile, setSelectedFile] = useState<CsvFileType>('MatrixInfo');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<'gui' | 'grid'>('gui');

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'gui' | 'grid' | null,
  ) => {
    if (newMode !== null) {
      setEditMode(newMode);
    }
  };

  useEffect(() => {
    setOriginalMatrixData(matrixData ? JSON.parse(JSON.stringify(matrixData)) : null);
    setHasChanges(false);
  }, [matrixData]);

  useEffect(() => {
    if (!matrixData || !originalMatrixData) {
      setHasChanges(false);
      return;
    }
    const isChanged = JSON.stringify(matrixData) !== JSON.stringify(originalMatrixData);
    setHasChanges(isChanged);
  }, [matrixData, originalMatrixData]);

  const handleSaveMatrix = async () => {
    if (selectedMatrix && matrixData) {
      alert("Saving..."); // Consider replacing with a less intrusive notification
      try {
        await api.SaveMatrix(selectedMatrix, matrixData);
        setOriginalMatrixData(JSON.parse(JSON.stringify(matrixData)));
        alert('Matrix saved successfully!');
      } catch (error) {
        console.error(`Failed to save matrix ${selectedMatrix}:`, error);
        alert('Failed to save matrix.');
      }
    }
  };

  const handleFullDataChange = (newData: MatrixData) => {
      onDataChange(newData);
  };
  
  const handleGridDataChange = (newSheetData: string[][]) => {
    if (!matrixData) return;
    const keyToUpdate: keyof MatrixData = selectedFile === 'MatrixInfo' ? 'matrixInfo'
                                      : selectedFile === 'TaxaInfo' ? 'taxaInfo'
                                      : 'traits';
    onDataChange({ ...matrixData, [keyToUpdate]: newSheetData });
  };

  const getCurrentSheetData = (): string[][] => {
      if (!matrixData) return [];
      switch (selectedFile) {
          case 'MatrixInfo': return matrixData.matrixInfo;
          case 'TaxaInfo': return matrixData.taxaInfo;
          case 'Traits': return matrixData.traits;
          default: return [];
      }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MatrixToolbar
        onSaveMatrix={handleSaveMatrix}
        isSaveDisabled={!hasChanges || isLoading}
      />
      
      {isLoading ? (
        <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><CircularProgress /></Box>
      ) : selectedMatrix && matrixData ? (
        <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
            <Box sx={{p: 1, display: 'flex', justifyContent: 'center', borderBottom: 1, borderColor: 'divider'}}>
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="edit mode"
                >
                    <ToggleButton value="gui" aria-label="gui mode">
                        <ViewListIcon sx={{mr: 1}}/>
                        GUI Mode
                    </ToggleButton>
                    <ToggleButton value="grid" aria-label="grid mode">
                        <GridOnIcon sx={{mr: 1}}/>
                        Grid Mode
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {editMode === 'grid' ? (
                <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Grid item xs={2} sx={{ height: '100%' }}>
                        <MatrixFileTree selectedFile={selectedFile} onSelectFile={setSelectedFile} />
                    </Grid>
                    <Grid item xs={10} sx={{ height: '100%' }}>
                        <MatrixDataGrid data={getCurrentSheetData()} onDataChange={handleGridDataChange} fileName={`${selectedFile} sheet`} />
                    </Grid>
                </Grid>
            ) : (
                <GuiEditor 
                    matrixData={matrixData} 
                    onDataChange={handleFullDataChange} 
                    selectedMatrix={selectedMatrix}
                />
            )}
        </Box>
      ) : (
        <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Typography>Please create a new matrix or load an existing one from the top bar.</Typography>
        </Box>
      )}
    </Box>
  );
};