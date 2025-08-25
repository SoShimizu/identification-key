import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { MatrixToolbar } from './MatrixToolbar';
import { MatrixFileTree } from './MatrixFileTree';
import { MatrixDataGrid } from './MatrixDataGrid';
import { CsvFileType, MatrixData } from '../../../types';
import * as api from '../../../../wailsjs/go/main/App';
import { GuiEditor } from './gui/GuiEditor';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridOnIcon from '@mui/icons-material/GridOn';

export const MatrixEditor: React.FC = () => {
  const [matrixList, setMatrixList] = useState<string[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<string>('');
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [originalMatrixData, setOriginalMatrixData] = useState<MatrixData | null>(null);
  const [selectedFile, setSelectedFile] = useState<CsvFileType>('MatrixInfo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [keysDirectory, setKeysDirectory] = useState<string>('');
  const [editMode, setEditMode] = useState<'grid' | 'gui'>('grid');

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'gui',
  ) => {
    if (newMode !== null) {
      setEditMode(newMode);
    }
  };

  const fetchMatrixList = useCallback(async () => {
    try {
      const list = await api.ListMatrixFiles();
      setMatrixList(list || []);
    } catch (error) {
      console.error('Failed to fetch matrix list:', error);
    }
  }, []);
  
  const fetchKeysDirectory = useCallback(async () => {
      try {
          const path = await api.GetKeysDirectory();
          setKeysDirectory(path);
      } catch (error) {
          console.error('Failed to fetch keys directory:', error);
      }
  }, []);

  useEffect(() => {
    fetchKeysDirectory();
    fetchMatrixList();
  }, [fetchKeysDirectory, fetchMatrixList]);

  useEffect(() => {
    if (!matrixData || !originalMatrixData) {
      setHasChanges(false);
      return;
    }
    const isChanged = JSON.stringify(matrixData) !== JSON.stringify(originalMatrixData);
    setHasChanges(isChanged);
  }, [matrixData, originalMatrixData]);

  const handleSelectMatrix = async (fileName: string) => {
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
    }
    setSelectedMatrix(fileName);
    if (fileName) {
      setIsLoading(true);
      try {
        const data = await api.LoadMatrix(fileName);
        setMatrixData(data);
        setOriginalMatrixData(JSON.parse(JSON.stringify(data)));
      } catch (error) {
        console.error(`Failed to load matrix ${fileName}:`, error);
        setMatrixData(null);
        setOriginalMatrixData(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setMatrixData(null);
      setOriginalMatrixData(null);
    }
  };

  const handleNewMatrix = () => {
    const newName = prompt('Enter new matrix file name (e.g., MyNewMatrix.xlsx):');
    if (newName && !matrixList.includes(newName)) {
      setIsLoading(true);
      api.CreateNewMatrix(newName)
        .then(() => {
          fetchMatrixList().then(() => {
            const finalName = newName.endsWith('.xlsx') ? newName : newName + '.xlsx';
            handleSelectMatrix(finalName);
          });
        })
        .catch(error => {
            alert(`Failed to create new matrix: ${error}`);
            console.error('Failed to create new matrix:', error);
        })
        .finally(() => setIsLoading(false));
    } else if (newName) {
      alert('A matrix with this file name already exists.');
    }
  };

  const handleSaveMatrix = async () => {
    if (selectedMatrix && matrixData) {
      setIsLoading(true);
      try {
        await api.SaveMatrix(selectedMatrix, matrixData);
        setOriginalMatrixData(JSON.parse(JSON.stringify(matrixData)));
        alert('Matrix saved successfully!');
      } catch (error) {
        console.error(`Failed to save matrix ${selectedMatrix}:`, error);
        alert('Failed to save matrix.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFullDataChange = (newData: MatrixData) => {
      setMatrixData(newData);
  };
  
  const handleGridDataChange = (newSheetData: string[][]) => {
    if (!matrixData) return;
    let keyToUpdate: keyof MatrixData;
    switch (selectedFile) {
      case 'MatrixInfo': keyToUpdate = 'matrixInfo'; break;
      case 'TaxaInfo': keyToUpdate = 'taxaInfo'; break;
      case 'Traits': keyToUpdate = 'traits'; break;
      default: return;
    }
    setMatrixData(prev => prev ? { ...prev, [keyToUpdate]: newSheetData } : null);
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

  const handleChangeDirectory = async () => {
      if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
          return;
      }
      try {
          const newPath = await api.SelectKeysDirectory();
          setKeysDirectory(newPath);
          setSelectedMatrix('');
          setMatrixData(null);
          setOriginalMatrixData(null);
          fetchMatrixList();
      } catch (error) {
          console.error('Failed to select new directory:', error);
      }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MatrixToolbar
        matrixList={matrixList}
        selectedMatrix={selectedMatrix}
        onSelectMatrix={handleSelectMatrix}
        onNewMatrix={handleNewMatrix}
        onSaveMatrix={handleSaveMatrix}
        isSaveDisabled={!hasChanges || isLoading}
        keysDirectory={keysDirectory}
        onChangeDirectory={handleChangeDirectory}
      />
      
      {isLoading ? (
        <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><CircularProgress /></Box>
      ) : selectedMatrix && matrixData ? (
        <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{p: 1, display: 'flex', justifyContent: 'center', borderBottom: 1, borderColor: 'divider'}}>
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="edit mode"
                >
                    <ToggleButton value="grid" aria-label="grid mode">
                        <GridOnIcon sx={{mr: 1}}/>
                        Grid Mode
                    </ToggleButton>
                    <ToggleButton value="gui" aria-label="gui mode">
                        <ViewListIcon sx={{mr: 1}}/>
                        GUI Mode
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
                // ★ 修正箇所：`selectedMatrix`をpropsとして渡す
                <GuiEditor 
                    matrixData={matrixData} 
                    onDataChange={handleFullDataChange} 
                    selectedMatrix={selectedMatrix}
                />
            )}
        </Box>
      ) : (
        <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Typography>Please create a new matrix or load an existing one.</Typography>
        </Box>
      )}
    </Box>
  );
};