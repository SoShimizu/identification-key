import React, { useState } from 'react';
import { Box, TextField, Button, Chip, Typography, Paper } from '@mui/material';

interface ChoiceListEditorProps {
  choices: string[];
  onChoicesChange: (newChoices: string[]) => void;
}

export const ChoiceListEditor: React.FC<ChoiceListEditorProps> = ({ choices, onChoicesChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const newChoice = inputValue.trim();
    if (newChoice && !choices.includes(newChoice)) {
      onChoicesChange([...choices, newChoice].sort());
    }
    setInputValue('');
  };

  const handleDelete = (choiceToDelete: string) => {
    onChoicesChange(choices.filter(choice => choice !== choiceToDelete));
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Define the allowed choices for this trait.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="New Choice"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          size="small"
          variant="outlined"
          sx={{ flexGrow: 1 }}
        />
        <Button onClick={handleAdd} variant="contained">Add</Button>
      </Box>
      <Paper variant="outlined" sx={{ p: 1, minHeight: '80px' }}>
        {choices.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {choices.map(choice => (
              <Chip
                key={choice}
                label={choice}
                onDelete={() => handleDelete(choice)}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', pt: 2}}>
            No choices defined.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};