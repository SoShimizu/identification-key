// frontend/src/components/tabs/report/ReportTabPanel.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Stack, ToggleButtonGroup, ToggleButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SaveReport } from '../../../../wailsjs/go/main/App';
import { STR } from '../../../i18n';
import { TaxonScore, Taxon } from '../../../api';
import { UseMatrixReturn } from '../../../hooks/useMatrix';
import { RichTextEditor } from '../../common/RichTextEditor'; // ★ RichTextEditorをインポート

// 学名をフォーマットするヘルパー関数
const formatTaxonNameForReport = (taxon: Taxon): string => {
    if (taxon.genus && taxon.species) {
        let name = `<i>${taxon.genus} ${taxon.species}</i>`;
        if (taxon.subspecies) {
            name += ` <i>${taxon.subspecies}</i>`;
        }
        return name;
    }
    return taxon.name || taxon.id;
};

// レポートをHTMLとして生成する関数
const generateReportHtml = (matrixState: UseMatrixReturn, lang: 'ja' | 'en'): string => {
    const s = STR[lang].report;
    const { matrixName, algo, opts, history, scores, matrixInfo } = matrixState;

    if (!matrixInfo) {
        return lang === 'ja' ? "<p>マトリクスが読み込まれていません。</p>" : "<p>No matrix is loaded.</p>";
    }

    let sb = '';
    const hr = "<p>--------------------------------------------------</p>";

    sb += "<h1>MyKeyLogue Identification Report</h1>";
    const now = new Date();
    sb += `<p><b>${s.date}:</b> ${now.toLocaleString(lang)}</p>`;

    sb += hr + `<p><b>${s.matrixInfoTitle}</b></p>`;
    const matrixTitle = lang === 'ja' ? matrixInfo.title_jp || matrixInfo.title_en : matrixInfo.title_en || matrixInfo.title_jp;
    sb += `<p>- <b>${s.matrixFile}:</b> ${matrixName}</p>`;
    sb += `<p>- <b>${s.matrixTitle}:</b> ${matrixTitle || 'N/A'}</p>`;
    sb += `<p>- <b>${s.matrixVersion}:</b> ${matrixInfo.version || 'N/A'}</p>`;

    sb += hr + `<p><b>${s.parametersUsed}</b></p>`;
    sb += `<p>- <b>${s.algorithm}:</b> ${algo}</p>`;
    if (algo === 'bayes') {
        sb += `<p>- <b>${s.conflictPenalty}:</b> ${opts.conflictPenalty.toFixed(2)}</p>`;
        sb += `<p>- <b>${s.gammaNAPenalty}:</b> ${opts.gammaNAPenalty.toFixed(2)}</p>`;
        sb += `<p>- <b>${s.kappa}:</b> ${opts.kappa.toFixed(2)}</p>`;
    }
    sb += `<p>- <b>${s.tolerance}:</b> ${(opts.toleranceFactor * 100).toFixed(0)}%</p>`;

    sb += hr + `<p><b>${s.observationHistory}</b></p>`;
    if (history.length === 0) {
        sb += `<p>${s.noObservations}</p>`;
    } else {
        history.forEach((item: any, i: number) => {
            sb += `<p>${i + 1}. ${item.traitName}: ${item.selection}</p>`;
        });
    }

    sb += hr + `<p><b>${s.finalRanking}</b></p>`;
    if (scores.length === 0) {
        sb += `<p>${s.noCandidates}</p>`;
    } else {
        sb += `<p>${s.rankHeader} | ${s.taxonHeader} | ${s.scoreHeader} | ${s.conflictsHeader} | ${s.matchSupportHeader}</p>`;
        sb += "<p>" + "".padEnd(85, "-") + "</p>";
        scores.slice(0, 10).forEach((score: TaxonScore, i: number) => {
            const probStr = (score.post * 100).toFixed(2) + '%';
            const matchSupport = `${score.match}/${score.support}`;
            const taxonNameHtml = formatTaxonNameForReport(score.taxon);
            sb += `<p>${String(i + 1)} | ${taxonNameHtml} | ${probStr} | ${String(score.conflicts)} | ${matchSupport}</p>`;
        });
        if (scores.length > 10) {
            sb += `<p>...and ${scores.length - 10} more.</p>`;
        }
    }
    
    return sb;
};

interface ReportTabPanelProps {
  matrixState: UseMatrixReturn;
}

export const ReportTabPanel: React.FC<ReportTabPanelProps> = ({ matrixState }) => {
    const { lang, history, scores } = matrixState;
    const [reportHtml, setReportHtml] = useState('');
    const [saveFormat, setSaveFormat] = useState<'txt' | 'docx'>('txt');

    useEffect(() => {
        if (matrixState.history.length > 0) {
            const newHtml = generateReportHtml(matrixState, lang);
            setReportHtml(newHtml);
        } else {
            setReportHtml("");
        }
    }, [matrixState, lang, history, scores]);

    const handleSave = async () => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const topCandidateName = scores.length > 0 ? scores[0].taxon.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
        const defaultName = `MyKeyLogue_Report_${timestamp}_${topCandidateName}.txt`;

        try {
            const path = await SaveReport(reportHtml, saveFormat, defaultName);
            if (path) {
                alert(`Report saved to: ${path}`);
            }
        } catch (error) {
            console.error("Failed to save report:", error);
            alert(`Failed to save report: ${error}`);
        }
    };
    
    const handleCopyToClipboard = async () => {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = reportHtml;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            await navigator.clipboard.writeText(plainText);
            alert('Report (plain text) copied to clipboard!');
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            alert("Failed to copy to clipboard.");
        }
    };

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexShrink: 0 }}>
                <Typography variant="h5">Identification Report</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ToggleButtonGroup
                        value={saveFormat}
                        exclusive
                        size="small"
                        onChange={(e, newFormat) => { if(newFormat) setSaveFormat(newFormat); }}
                        aria-label="save format"
                    >
                        <ToggleButton value="txt">TXT</ToggleButton>
                        <ToggleButton value="docx">WORD</ToggleButton>
                    </ToggleButtonGroup>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyToClipboard}
                        disabled={history.length === 0}
                    >
                        Copy
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
            <Paper variant="outlined" sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
                {history.length > 0 ? (
                    <RichTextEditor
                        label=""
                        value={reportHtml}
                        onValueChange={setReportHtml}
                        height="100%"
                    />
                ) : (
                    <Box sx={{p: 2}}>
                        <Typography>No identification session is active. Please select some traits in the KEY tab to generate a report.</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};