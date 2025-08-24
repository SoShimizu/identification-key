// frontend/src/components/header/ReportDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, Select, MenuItem, Stack, Typography, SelectChangeEvent
} from '@mui/material';
import { GenerateIdentificationReport, SaveReportDialog } from '../../../wailsjs/go/main/App';
import { main } from '../../../wailsjs/go/models';
import { RibbonProps } from './Ribbon';


type Props = Omit<RibbonProps, 'undo' | 'redo' | 'canUndo' | 'canRedo' | 'onRefreshKeys' | 'onPickKey'> & {
  open: boolean;
  onClose: () => void;
  currentLang: 'ja' | 'en';
};

export default function ReportDialog({ open, onClose, currentLang, ...props }: Props) {
  const [reportLang, setReportLang] = useState<'ja' | 'en'>(currentLang);
  const [filename, setFilename] = useState('');

  useEffect(() => {
    if (open) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const topCandidateName = props.scores.length > 0 ? props.scores[0].taxon.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
      
      const reportNameJa = `MyKeyLogueレポート_${timestamp}_${topCandidateName}.txt`;
      const reportNameEn = `MyKeyLogue_Report_${timestamp}_${topCandidateName}.txt`;
      
      setReportLang(currentLang);
      setFilename(currentLang === 'ja' ? reportNameJa : reportNameEn);
    }
  }, [open, currentLang, props.scores]);


  const handleCreateReport = async () => {
    try {
        const path = await SaveReportDialog(filename);

        if (path) {
            const reportRequest = new main.ReportRequest({
                lang: reportLang,
                matrixName: props.matrixName,
                algorithm: props.algo,
                options: props.opts,
                history: props.history,
                finalScores: props.scores,
                matrixInfo: props.matrixInfo,
            });
            await GenerateIdentificationReport(reportRequest, path);
            onClose(); // Close dialog on success
        }
    } catch (error) {
        console.error("Failed to save report:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Identification Report</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="body2">
            Configure the options for your report file. The file will be saved to the "my_identification_reports" folder unless you choose a different location in the system dialog.
          </Typography>
          <TextField
            fullWidth
            label="Filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Report Language</InputLabel>
            <Select
              value={reportLang}
              label="Report Language"
              onChange={(e: SelectChangeEvent<'ja' | 'en'>) => setReportLang(e.target.value as 'ja' | 'en')}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ja">日本語</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateReport}>
          Create and Save Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}