// frontend/src/components/tabs/report/ReportTabPanel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, Typography, Paper, Stack, Divider, Tooltip, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useMatrix } from '../../../hooks/useMatrix';
import { main } from '../../../../wailsjs/go/models';
import { STR } from '../../../i18n';
import { SaveReportDialog } from '../../../../wailsjs/go/main/App';

// バックエンドのGoコードからレポート生成ロジックをJSで再現
const generateReportText = (matrixState: any, lang: 'ja' | 'en'): string => {
    const s = STR[lang].report; // i18n.ts に report セクションを後で追加
    const { matrixName, algo, opts, history, scores, matrixInfo } = matrixState;

    let sb = '';
    const hr = "--------------------------------------------------\n";

    sb += "==================================================\n";
    sb += `       ${s.title}\n`;
    sb += "==================================================\n\n";
    
    const now = new Date();
    sb += `${s.date}: ${now.toLocaleString(lang)}\n\n`;

    sb += hr + `${s.matrixInfoTitle}\n` + hr;
    const matrixTitle = lang === 'ja' ? matrixInfo?.title_jp || matrixInfo?.title_en : matrixInfo?.title_en || matrixInfo?.title_jp;
    sb += `  - ${s.matrixFile}: ${matrixName}\n`;
    sb += `  - ${s.matrixTitle}: ${matrixTitle || 'N/A'}\n`;
    sb += `  - ${s.matrixVersion}: ${matrixInfo?.version || 'N/A'}\n\n`;

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
        scores.slice(0, 10).forEach((score: any, i: number) => {
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
    const { lang, history } = matrixState;
    const [reportText, setReportText] = useState('');

    useEffect(() => {
        const newText = generateReportText(matrixState, lang);
        setReportText(newText);
    }, [matrixState, lang]);

    const handleSave = async () => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const topCandidateName = matrixState.scores.length > 0 ? matrixState.scores[0].taxon.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
        const defaultName = `MyKeyLogue_Report_${timestamp}_${topCandidateName}.txt`;

        try {
            const path = await SaveReportDialog(defaultName);
            if (path) {
                // GenerateIdentificationReport はバックエンドでテキストを生成するため、ここでは使用しない
                // 代わりにフロントで生成したテキストを直接保存する
                // このためにはバックエンドにテキストを保存する関数が必要になるが、
                // Wailsの標準機能にはないため、ここではクリップボードコピーで代用する
                // 本来はバックエンドに `SaveTextToFile(path, content)` のような関数を実装する
                await navigator.clipboard.writeText(reportText);
                alert(`Report content copied to clipboard. Please paste it into the file: ${path}`);
            }
        } catch (error) {
            console.error("Failed to save report:", error);
            alert("Failed to save report. Content copied to clipboard instead.");
            await navigator.clipboard.writeText(reportText);
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
            <Paper variant="outlined" sx={{ flex: 1, p: 2, fontFamily: 'monospace', whiteSpace: 'pre', overflow: 'auto' }}>
                {history.length > 0 ? reportText : "No identification session is active. Please select some traits in the KEY tab to generate a report."}
            </Paper>
        </Box>
    );
};