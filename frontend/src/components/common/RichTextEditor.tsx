import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's default theme CSS
import { Box, Typography, useTheme, GlobalStyles } from '@mui/material';

// Function to generate styles that adapt to MUI's theme
const editorGlobalStyles = (theme: any) => ({
    '.ql-toolbar': {
        backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#f3f4f6',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px',
        borderColor: theme.palette.divider,
        // Adjust icon colors for the current theme
        '.ql-stroke': {
            stroke: theme.palette.text.primary,
        },
        '.ql-picker-label': {
            color: theme.palette.text.primary,
        },
        '.ql-active .ql-stroke': {
            stroke: theme.palette.primary.main,
        },
         '.ql-active .ql-fill': {
            fill: theme.palette.primary.main,
        },
    },
    '.ql-container': {
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.paper,
    },
    '.ql-editor': {
        color: theme.palette.text.primary,
        fontFamily: theme.typography.fontFamily,
        fontSize: '0.9rem',
        minHeight: '100px',
        lineHeight: 1.5,
    },
    '.ql-editor.ql-blank::before': {
        color: theme.palette.text.secondary,
        fontStyle: 'normal',
    },
});

interface RichTextEditorProps {
  label: string;
  value: string;
  onValueChange: (newValue: string) => void;
  placeholder?: string;
  height?: number | string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onValueChange, placeholder, height = 120 }) => {
  const theme = useTheme();
  // Quill's empty state is '<p><br></p>', treat it as an empty string
  const processedValue = value === '<p><br></p>' ? '' : value || '';

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean'] // Format clearing button
    ],
  };

  return (
    <Box>
        <GlobalStyles styles={editorGlobalStyles(theme)} />
        <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>{label}</Typography>
        <ReactQuill
            theme="snow"
            value={processedValue}
            onChange={onValueChange}
            modules={modules}
            placeholder={placeholder}
            style={{ minHeight: height }}
        />
    </Box>
  );
};