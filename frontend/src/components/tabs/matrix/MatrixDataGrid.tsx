import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';

interface MatrixDataGridProps {
  data: string[][];
  onDataChange: (newData: string[][]) => void;
  fileName: string;
}

export const MatrixDataGrid: React.FC<MatrixDataGridProps> = ({ data, onDataChange, fileName }) => {
  if (!data || data.length === 0) {
    const handleAddFirstRow = () => {
      onDataChange([['']]);
    };
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No data in {fileName}.</Typography>
        <Button onClick={handleAddFirstRow} sx={{mt: 1}}>Add First Row</Button>
      </Box>
    );
  }

  const header = data[0] || [];
  const rowsData = data.slice(1);

  const columns: GridColDef[] = header.map((col, index) => ({
    field: `col${index}`,
    headerName: col || `Column ${index + 1}`,
    width: 150,
    editable: true,
  }));

  const rows: GridRowsProp = rowsData.map((row, rowIndex) => {
    const rowObject: { [key: string]: any } = { id: rowIndex };
    for (let i = 0; i < header.length; i++) {
        rowObject[`col${i}`] = row[i] || '';
    }
    return rowObject;
  });

  const processRowUpdate = (newRow: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    const rowIndexInData = newRow.id + 1;

    if (newData[rowIndexInData]) {
        for (const key in newRow) {
            if (key.startsWith('col')) {
                const colIndex = parseInt(key.substring(3), 10);
                // Ensure array has enough space before assigning
                if(newData[rowIndexInData].length <= colIndex) {
                    newData[rowIndexInData].length = colIndex + 1;
                }
                if (newData[rowIndexInData][colIndex] !== newRow[key]) {
                    newData[rowIndexInData][colIndex] = newRow[key];
                }
            }
        }
    }
    onDataChange(newData);
    return newRow;
  };

  const handleAddRow = () => {
    const newRow = Array(header.length).fill('');
    onDataChange([...data, newRow]);
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{p: 1, display: 'flex', justifyContent: 'flex-end'}}>
             <Button onClick={handleAddRow} variant="outlined" size="small">Add Row</Button>
        </Box>
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => console.error(error)}
          rowHeight={38}
          // --- ★ここから下を全面的に修正 ---
          sx={{
            // グリッド全体のデフォルト文字色
            color: '#e7f0f8',
            border: '1px solid',
            borderColor: 'divider',
            // ヘッダーのスタイル
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#374151',
              borderColor: 'divider',
            },
            // フッターのスタイル
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#374151',
              borderColor: 'divider',
            },
            // 各セルのボーダー色
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            // ページネーションの文字色など
            '& .MuiTablePagination-root': {
                color: '#e7f0f8',
            },
            // 編集中のセルの入力文字色
            '& .MuiInputBase-input': {
                color: '#e7f0f8',
            },
          }}
          // --- ★ここまで修正 ---
        />
      </Box>
    </Box>
  );
};