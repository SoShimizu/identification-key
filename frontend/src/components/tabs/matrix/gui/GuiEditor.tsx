// soshimizu/key-testa/key-testA-eececee799c6cbc1a9ab195da73ad52495f23149/frontend/src/components/tabs/matrix/gui/GuiEditor.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { MatrixData } from '../../../../types';
import { parseTaxaInfo, parseTraits, TraitInfoItem } from '../matrixUtils';
import { EntityList } from './EntityList';
import { TaxonEditorForm } from './TaxonEditorForm';
import { TraitEditorForm } from './TraitEditorForm';
import { StateEditor } from './StateEditor';
import * as api from '../../../../../wailsjs/go/main/App';

interface GuiEditorProps {
  matrixData: MatrixData;
  onDataChange: (newData: MatrixData) => void;
  selectedMatrix: string;
}

export const GuiEditor: React.FC<GuiEditorProps> = ({
  matrixData,
  onDataChange,
  selectedMatrix,
}) => {
  // 2D配列を渡す（型エラー対策）
  const taxa = useMemo(() => parseTaxaInfo(matrixData.taxaInfo), [matrixData.taxaInfo]);
  const traits = useMemo(() => parseTraits(matrixData.traits), [matrixData.traits]);

  const [selectedItem, setSelectedItem] = useState<{ type: 'taxon' | 'trait'; index: number } | null>(null);

  useEffect(() => {
    setSelectedItem(null);
  }, [selectedMatrix]);

  // ヘッダー行
  const taxonHeader: string[] = matrixData.taxaInfo[0] || [];
  const traitHeader: string[] = matrixData.traits[0] || [];

  // TaxonID 列インデックス
  const taxonIdCol = useMemo(
    () => taxonHeader.findIndex(h => h.trim() === '#TaxonID'),
    [taxonHeader]
  );

  // 全 TaxonID セット
  const allTaxonIDs = useMemo(() => {
    const ids = new Set<string>();
    if (taxonIdCol >= 0) {
      for (let i = 1; i < matrixData.taxaInfo.length; i++) {
        const row = matrixData.taxaInfo[i] || [];
        const id = row[taxonIdCol] || '';
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [matrixData.taxaInfo, taxonIdCol]);

  // traits の #TraitID を自動補完（空なら UUID 付与）
  useEffect(() => {
    const header = matrixData.traits[0] || [];
    const idColIndex = header.findIndex(h => h.trim() === '#TraitID');
    if (idColIndex === -1) return;

    let needsUpdate = false;
    const updated = JSON.parse(JSON.stringify(matrixData.traits)) as string[][];
    const tasks = updated.slice(1).map((row, i) => {
      if (!row[idColIndex] || row[idColIndex].trim() === '') {
        needsUpdate = true;
        return api.GenerateUUID().then(uuid => {
          updated[i + 1][idColIndex] = uuid;
        });
      }
      return Promise.resolve();
    });

    Promise.all(tasks).then(() => {
      if (needsUpdate) onDataChange({ ...matrixData, traits: updated });
    });
  }, [matrixData, onDataChange]);

  const handleSelectItem = (type: 'taxon' | 'trait', index: number) => {
    setSelectedItem({ type, index });
  };

  const handleAddItem = async (type: 'taxon' | 'trait') => {
    const uuid = await api.GenerateUUID();
    const newData: MatrixData = JSON.parse(JSON.stringify(matrixData));
    if (type === 'taxon') {
      const header = newData.taxaInfo[0] || [];
      const newRow = Array(header.length).fill('');
      const idIndex = header.findIndex((h: string) => h === '#TaxonID');
      if (idIndex !== -1) newRow[idIndex] = uuid;
      newData.taxaInfo.push(newRow);
    } else {
      const header = newData.traits[0] || [];
      const newRow = Array(header.length).fill('');
      const idIndex = header.findIndex((h: string) => h === '#TraitID');
      if (idIndex !== -1) newRow[idIndex] = uuid;
      newData.traits.push(newRow);
    }
    onDataChange(newData);
  };

  const handleRemoveItem = (type: 'taxon' | 'trait', rowIndex: number) => {
    // ヘッダー（index 0）は削除しない
    if (rowIndex === 0) return;
    const newData: MatrixData = JSON.parse(JSON.stringify(matrixData));
    if (type === 'taxon') {
      newData.taxaInfo = newData.taxaInfo.filter((_, i) => i !== rowIndex);
    } else {
      newData.traits = newData.traits.filter((_, i) => i !== rowIndex);
    }
    onDataChange(newData);
    setSelectedItem(null);
  };

  // Definition Editor（中央）
  const renderDefinitionEditor = () => {
    if (!selectedItem) {
      return <Typography color="text.secondary">No item selected</Typography>;
    }

    if (selectedItem.type === 'taxon') {
      const rowData = matrixData.taxaInfo[selectedItem.index] || [];
      const onRowChange = (newRowData: string[]) => {
        const newData: MatrixData = JSON.parse(JSON.stringify(matrixData));
        newData.taxaInfo[selectedItem.index] = newRowData;
        onDataChange(newData);
      };
      return (
        <TaxonEditorForm
          header={taxonHeader}
          rowData={rowData}
          onRowChange={onRowChange}
        />
      );
    }

    // trait
    const rowData = matrixData.traits[selectedItem.index] || [];
    const onRowChange = (newRowData: string[]) => {
      const newData: MatrixData = JSON.parse(JSON.stringify(matrixData));
      newData.traits[selectedItem.index] = newRowData;
      onDataChange(newData);
    };
    return (
      <TraitEditorForm
        allTaxonIDs={allTaxonIDs}
        allTraits={traits as TraitInfoItem[]}
        header={traitHeader}
        rowData={rowData}
        onRowChange={onRowChange}
        matrixData={matrixData}
        traitRowIndex={selectedItem.index}
      />
    );
  };

  // StateEditor（右）
  const handleStateChange = (traitRowIndex: number, taxonColIndex: number, newValue: string) => {
    const newData: MatrixData = JSON.parse(JSON.stringify(matrixData));
    const row = [...(newData.traits[traitRowIndex] || [])];
    while (row.length <= taxonColIndex) row.push('');
    row[taxonColIndex] = newValue;
    newData.traits[traitRowIndex] = row;
    onDataChange(newData);
  };

  const selectedTaxon =
    selectedItem?.type === 'taxon'
      ? taxa.find(t => t.rowIndex === selectedItem.index) || null
      : null;

  return (
    // 3カラムレイアウト（親が子のサイズに引っ張られないように overflow hidden を付与）
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 25%) 1fr 1fr',
        height: '100%',
        width: '100%',
        minHeight: 0,
        overflow: 'hidden', // ★ これで親が伸びない
      }}
    >
      {/* 1) 左ペイン（EntityList フィット） */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, minHeight: 0, display: 'flex' }}>
          <EntityList
            taxa={taxa}
            traits={traits}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
          />
        </Box>
      </Box>

      {/* 2) 中央ペイン（Definition Editor） */}
      <Box sx={{ minWidth: 0, minHeight: 0, p: 2, display: 'flex', contain: 'layout paint size' /* ★ 親を膨らませない */ }}>
        <Paper
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h6"
            sx={{ p: 2, pb: 1, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
          >
            Definition Editor
          </Typography>
          <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
            <Box sx={{ p: 2 }}>{renderDefinitionEditor()}</Box>
          </Box>
        </Paper>
      </Box>

      {/* 3) 右ペイン（State Editor） */}
      <Box sx={{ minWidth: 0, minHeight: 0, p: 2, pl: 0, display: 'flex', contain: 'layout paint size' /* ★ 親を膨らませない */ }}>
        <Paper
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h6"
            sx={{ p: 2, pb: 1, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
          >
            State Editor
          </Typography>
          <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
            <Box sx={{ p: 2 }}>
              {selectedTaxon ? (
                <StateEditor
                  selectedTaxon={selectedTaxon}
                  allTraits={traits}
                  matrixData={matrixData}
                  onStateChange={handleStateChange}
                />
              ) : (
                <Typography color="text.secondary">Select a taxon to edit states</Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
