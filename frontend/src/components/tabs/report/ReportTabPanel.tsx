// frontend/src/components/tabs/report/ReportTabPanel.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useMatrix } from '../../../hooks/useMatrix';
import { GenerateIdentificationReport, SaveReportDialog } from '../../../../wailsjs/go/main/App';
import { main } from '../../../../wailsjs/go/models';
import { STR } from '../../../i18n';
import { MatrixInfo, TaxonScore } from '../../../api';

const generateReportText = (matrixState: any, lang: 'ja' | 'en'): string => {
    const s = STR[lang].report;
    const { matrixName, algo, opts, history, scores, matrixInfo } = matrixState;

    if (!matrixInfo) {
        return lang === 'ja' ? "マトリクスが読み込まれていません。" : "No matrix is loaded.";
    }

    let sb = '';
    const hr = "--------------------------------------------------\n";

    sb += "==================================================\n";
    sb += `       ${s.title}\n`;
    sb += "==================================================\n\n";
    
    const now = new Date();
    sb += `${s.date}: ${now.toLocaleString(lang)}\n\n`;

    sb += hr + `${s.matrixInfoTitle}\n` + hr;
    const matrixTitle = lang === 'ja' ? matrixInfo.title_jp || matrixInfo.title_en : matrixInfo.title_en || matrixInfo.title_jp;
    sb += `  - ${s.matrixFile}: ${matrixName}\n`;
    sb += `  - ${s.matrixTitle}: ${matrixTitle || 'N/A'}\n`;
    sb += `  - ${s.matrixVersion}: ${matrixInfo.version || 'N/A'}\n\n`;

    sb += hr + `${s.parametersUsed}\n` + hr;
    sb += `  - ${s.algorithm}: ${algo}\n`;
    if (algo === 'bayes') {
        sb += `  - ${s.conflictPenalty}: ${opts.conflictPenalty.toFixed(2)}\n`;
        sb += `  - ${s.gammaNAPenalty}: ${opts.gammaNAPenalty.toFixed(2)}\n`;
        sb += `  - ${s.kappa}: ${opts.kappa.toFixed(2)}\n`;
    }
    sb += `  - ${s.tolerance}: ${(opts.toleranceFactor * 100).toFixed(0)}%\n\n`;

    sb += hr + `${s.observationHistory}\n` + hr;
    if (history.length === 0) {
        sb += `  ${s.noObservations}\n`;
    } else {
        history.forEach((item: any, i: number) => {
            sb += `  ${i + 1}. ${item.traitName}: ${item.selection}\n`;
        });
    }
    sb += "\n";

    sb += hr + `${s.finalRanking}\n` + hr;
    if (scores.length === 0) {
        sb += `  ${s.noCandidates}\n`;
    } else {
        const header = `${s.rankHeader.padEnd(6)} ${s.taxonHeader.padEnd(40)} ${s.scoreHeader.padEnd(15)} ${s.conflictsHeader.padEnd(12)} ${s.matchSupportHeader.padEnd(10)}\n`;
        sb += header;
        sb += "".padEnd(85, "-") + "\n";
        scores.slice(0, 10).forEach((score: TaxonScore, i: number) => {
            const probStr = (score.post * 100).toFixed(2) + '%';
            const matchSupport = `${score.match}/${score.support}`;
            const taxonName = score.taxon.name || score.taxon.id;
            sb += `${String(i + 1).padEnd(6)} ${taxonName.padEnd(40)} ${probStr.padEnd(15)} ${String(score.conflicts).padEnd(12)} ${matchSupport.padEnd(10)}\n`;
        });
        if (scores.length > 10) {
            sb += `  ...and ${scores.length - 10} more.\n`;
        }
    }
    sb += "\n";

    return sb;
};

export const ReportTabPanel: React.FC = () => {
    const matrixState = useMatrix();
    const { lang, history, scores, matrixInfo, algo, opts, matrixName } = matrixState;
    const [reportText, setReportText] = useState('');

    useEffect(() => {
        console.log('[ReportTabPanel] useEffect triggered. Recalculating report text.');
        console.log(`[ReportTabPanel] Dependencies: history length=${history.length}, scores length=${scores.length}, matrixName=${matrixName}, lang=${lang}`);
        
        const newText = generateReportText(matrixState, lang);
        setReportText(newText);
    }, [matrixState, lang]); // ★ 依存配列を修正

    const handleSave = async () => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const topCandidateName = scores.length > 0 ? scores[0].taxon.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
        const defaultName = `MyKeyLogue_Report_${timestamp}_${topCandidateName}.txt`;

        try {
            const path = await SaveReportDialog(defaultName);

            if (path) {
                const reportRequest = new main.ReportRequest({
                    lang: lang,
                    matrixName: matrixName,
                    algorithm: algo,
                    options: opts,
                    history: history,
                    finalScores: scores,
                    matrixInfo: matrixInfo as MatrixInfo,
                });
                await GenerateIdentificationReport(reportRequest, path);
                alert(`Report saved to: ${path}`);
            }
        } catch (error) {
            console.error("Failed to save report:", error);
            alert("Failed to save report.");
        }
    };
    
    const handleCopyToClipboard = async () => {
        await navigator.clipboard.writeText(reportText);
        alert('Report copied to clipboard!');
    };

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexShrink: 0 }}>
                <Typography variant="h5">Identification Report</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyToClipboard}
                        disabled={history.length === 0}
                    >
                        Copy to Clipboard
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={history.length === 0}
                    >
                        Save Report
                    </Button>
                </Stack>
            </Stack>
            <Paper variant="outlined" sx={{ flex: 1, p: 2, fontFamily: 'monospace', whiteSpace: 'pre', overflow: 'auto', fontSize: '0.8rem' }}>
                {history.length > 0 ? reportText : "No identification session is active. Please select some traits in the KEY tab to generate a report."}
            </Paper>
        </Box>
    );
};