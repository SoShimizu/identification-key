// frontend/src/components/tabs/matrix/MatrixToolbar.tsx
import React from 'react';
import { Box, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface MatrixToolbarProps {
  onSaveMatrix: () => void;
  isSaveDisabled: boolean;
}

export const MatrixToolbar: React.FC<MatrixToolbarProps> = ({
  onSaveMatrix,
  isSaveDisabled,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />} 
            onClick={onSaveMatrix} 
            disabled={isSaveDisabled}
        >
            Save Changes
        </Button>
    </Box>
  );
};