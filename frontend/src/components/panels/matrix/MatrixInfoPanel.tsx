// frontend/src/components/panels/matrix/MatrixInfoPanel.tsx
import React, { useState } from 'react';
import { Box, Typography, Paper, Link, Divider, Tabs, Tab } from '@mui/material';
import { MatrixInfo } from '../../../api';

type Props = {
    info: MatrixInfo | null;
    lang: 'ja' | 'en';
};

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary" component="div">{label}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>
        </Box>
    );
};

export default function MatrixInfoPanel({ info, lang }: Props) {
    const [activeTab, setActiveTab] = useState(0);

    if (!info) {
        return (
            <Paper variant="outlined" sx={{ height: '100%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Matrix information loading...</Typography>
            </Paper>
        );
    }
    
    const isJa = lang === 'ja';

    const tabs = [];
    const description = isJa ? info.description_jp || info.description_en : info.description_en || info.description_jp;
    const authors = isJa ? info.authors_jp || info.authors_en : info.authors_en || info.authors_jp;
    const citation = isJa ? info.citation_jp || info.citation_en : info.citation_en || info.citation_jp;
    const references = isJa ? info.references_jp || info.references_en : info.references_en || info.references_jp;

    if (description) tabs.push(isJa ? "解説" : "Description");
    if (authors || citation) tabs.push(isJa ? "著者と引用" : "Authors & Citation");
    if (references) tabs.push(isJa ? "参考文献" : "References");


    return (
        <Paper variant="outlined" sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{flexShrink: 0}}>
                <Typography variant="h6">{isJa ? info.title_jp || info.title_en : info.title_en || info.title_jp}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Version: {info.version}
                </Typography>
            </Box>
            
            {tabs.length > 0 && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
                       {tabs.map(label => <Tab key={label} label={label} sx={{minWidth: 'auto'}}/>)}
                    </Tabs>
                </Box>
            )}

            <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
                {tabs[activeTab] === (isJa ? "解説" : "Description") && <InfoRow label="" value={description} />}
                {tabs[activeTab] === (isJa ? "著者と引用" : "Authors & Citation") && (
                    <>
                        <InfoRow label={isJa ? "著者" : "Authors"} value={authors} />
                        <InfoRow label={isJa ? "引用" : "Citation"} value={citation} />
                    </>
                )}
                {tabs[activeTab] === (isJa ? "参考文献" : "References") && <InfoRow label="" value={references} />}
            </Box>
        </Paper>
    );
}