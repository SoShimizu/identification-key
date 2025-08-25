// frontend/src/components/common/FormatToolbar.tsx
import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';

interface FormatToolbarProps {
  onFormat: (format: 'b' | 'i' | 'u') => void;
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({ onFormat }) => {
  return (
    <ToggleButtonGroup size="small" aria-label="text formatting">
      <Tooltip title="Bold (Ctrl+B)">
        <ToggleButton value="bold" aria-label="bold" onClick={() => onFormat('b')}>
          <FormatBoldIcon />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Italic (Ctrl+I)">
        <ToggleButton value="italic" aria-label="italic" onClick={() => onFormat('i')}>
          <FormatItalicIcon />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Underline (Ctrl+U)">
        <ToggleButton value="underline" aria-label="underline" onClick={() => onFormat('u')}>
          <FormatUnderlinedIcon />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};