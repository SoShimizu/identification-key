// frontend/src/components/panels/matrix/MatrixInfoPanel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { MatrixInfo } from '../../../api';

const HtmlRenderer: React.FC<{ content: string, component?: React.ElementType, variant?: string }> = ({ content, component, variant }) => {
    return <Typography variant={variant as any || "body2"} component={component || "div"} sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />;
};

const InfoRow: React.FC<{ label: string; value?: string | null; isHtml?: boolean }> = ({ label, value, isHtml }) => {
    if (!value) return null;
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary" component="div">{label}</Typography>
            {isHtml ? <HtmlRenderer content={value} /> : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>}
        </Box>
    );
};

type Props = {
    info: MatrixInfo | null;
    lang: 'ja' | 'en';
};

export default function MatrixInfoPanel({ info, lang }: Props) {
    const [activeTab, setActiveTab] = useState(0);
    const isJa = lang === 'ja';

    // ★ infoオブジェクトが存在するかどうかで条件分岐させる
    const description = info ? (isJa ? info.description_jp || info.description_en : info.description_en || info.description_jp) : null;
    const authors = info ? (isJa ? info.authors_jp || info.authors_en : info.authors_en || info.authors_jp) : null;
    const citation = info ? (isJa ? info.citation_jp || info.citation_en : info.citation_en || info.citation_jp) : null;
    const references = info ? (isJa ? info.references_jp || info.references_en : info.references_en || info.references_jp) : null;

    const tabs = useMemo(() => {
        const newTabs = [];
        if (description) newTabs.push(isJa ? "解説" : "Description");
        if (authors || citation) newTabs.push(isJa ? "著者と引用" : "Authors & Citation");
        if (references) newTabs.push(isJa ? "参考文献" : "References");
        return newTabs;
    }, [description, authors, citation, references, isJa]);
    
    // ★ フックの呼び出し順序を修正
    useEffect(() => {
        console.log('[MatrixInfoPanel] Component re-rendered. Received info:', info);
        if (activeTab >= tabs.length) {
            setActiveTab(0);
        }
    }, [info, tabs, activeTab]);

    if (!info) {
        return (
            <Paper variant="outlined" sx={{ height: '100%', width: '100%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Matrix information not available.</Typography>
            </Paper>
        );
    }

    return (
        <Paper variant="outlined" sx={{ height: '100%', width: '100%', p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{flexShrink: 0}}>
                <HtmlRenderer
                    content={isJa ? info.title_jp || info.title_en : info.title_en || info.title_jp}
                    variant="h6"
                    component="h2"
                />
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
                {tabs[activeTab] === (isJa ? "解説" : "Description") && <InfoRow label="" value={description} isHtml />}
                {tabs[activeTab] === (isJa ? "著者と引用" : "Authors & Citation") && (
                    <>
                        <InfoRow label={isJa ? "著者" : "Authors"} value={authors} />
                        <InfoRow label={isJa ? "引用" : "Citation"} value={citation} isHtml />
                    </>
                )}
                {tabs[activeTab] === (isJa ? "参考文献" : "References") && <InfoRow label="" value={references} isHtml />}
            </Box>
        </Paper>
    );
}