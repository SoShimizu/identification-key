// frontend/src/components/header/RibbonWelcomeTab.tsx
import React from "react";
import { Box, Card, CardContent, Stack, Link, Typography } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import BugReportIcon from '@mui/icons-material/BugReport';
import ArticleIcon from '@mui/icons-material/Article';
import { STR } from "../../i18n";

type Props = {
  lang: "ja" | "en";
};

export default function RibbonWelcomeTab({ lang }: Props) {
  const ja = lang === 'ja';

  const matrixTable = `
    <table class="manual-table">
        <thead><tr><th>${ja ? "形質タイプ" : "Trait Type"}</th><th>${ja ? "説明" : "Description"}</th><th>${ja ? "入力例" : "Input Examples"}</th></tr></thead>
        <tbody>
            <tr><td><code>binary</code></td><td>${ja ? "はい/いいえ の二択" : "Yes/No"}</td><td><code>1</code>, <code>-1</code>, <code>0</code>, (blank)</td></tr>
            <tr><td><code>continuous</code></td><td>${ja ? "連続値" : "Continuous value"}</td><td><code>5.2</code> or <code>3.1-4.5</code></td></tr>
            <tr><td><code>nominal</code></td><td>${ja ? "多状態" : "Multi-state"}</td><td>e.g., <code>orange</code>, <code>black</code></td></tr>
        </tbody>
    </table>`;

  return (
    <Box 
        sx={{ 
            maxHeight: '70vh', 
            overflowY: 'auto', 
            p: 1,
            '.manual-table': {
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                    border: 1,
                    borderColor: 'divider',
                    p: 1,
                    textAlign: 'left',
                    verticalAlign: 'top',
                    fontSize: '0.8rem',
                },
                '& th': {
                    backgroundColor: 'action.hover',
                    fontWeight: 'bold',
                },
                '& code': {
                    fontFamily: 'monospace',
                    backgroundColor: 'action.disabledBackground',
                    px: '4px',
                    py: '2px',
                    borderRadius: '4px',
                }
            }
        }}
    >
        <Typography variant="h4" gutterBottom sx={{fontWeight: 'bold'}}>
            {ja ? "ClavisIDへようこそ！" : "Welcome to ClavisID!"}
        </Typography>
        <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold'}}>
            An Intelligent, Interactive Multi-Access Key for Taxonomic Identification
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
            {ja ? "ClavisIDは、形質行列に基づく知的でインタラクティブなマルチアクセス分類学的検索表ツールです。" : "ClavisID is an intelligent, interactive multi-access key for taxonomic identification tool, built on trait matrices"}
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 2 }}>
                 <Card variant="outlined">
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ArticleIcon color="primary" sx={{mr: 1}}/>
                            <Typography variant="h6">{ja ? "マトリクスの作り方" : "How to Create a Matrix"}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{mb: 2}}>
                             {ja ? "ClavisIDは、特定のフォーマットに準拠したExcelファイル (.xlsx) を読み込みます。" : "ClavisID reads Excel files (.xlsx) that follow a specific format."}
                        </Typography>
                        <Box dangerouslySetInnerHTML={{ __html: matrixTable }} />
                    </CardContent>
                 </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
                <Stack spacing={2}>
                    <Card variant="outlined">
                        <CardContent>
                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <InfoIcon color="primary" sx={{mr: 1}}/>
                                <Typography variant="h6">{ja ? "引用方法" : "How to Cite"}</Typography>
                            </Box>
                            <Typography variant="body2">
                                <strong>Shimizu S. 2025.</strong> ClavisID: An Intelligent, Interactive Multi-Access Key for Taxonomic Identification.
                                <Link href="https://github.com/soshimizu/identification-key" target="_blank" display="block" sx={{wordBreak: 'break-all'}}>
                                    github.com/soshimizu/identification-key
                                </Link>
                            </Typography>
                        </CardContent>
                    </Card>
                     <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <BugReportIcon color="primary" sx={{mr: 1}}/>
                                <Typography variant="h6">{ja ? "バグ報告" : "Bug Reports"}</Typography>
                            </Box>
                            <Typography variant="body2">
                                {ja ? "不具合やご要望はGitHub Issuesまでお願いします。" : "Please submit reports or requests to GitHub Issues."}
                                <Link href="https://github.com/soshimizu/identification-key/issues" target="_blank" display="block">
                                    GitHub Issues
                                </Link>
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Stack>
    </Box>
  );
}