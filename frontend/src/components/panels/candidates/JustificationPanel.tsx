// frontend/src/components/panels/candidates/JustificationPanel.tsx
import React from 'react';
import {
    Box, Typography, CircularProgress, IconButton, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';
import { Taxon, Justification, JustificationItem } from '../../../api';
import { STR } from '../../../i18n';
import { FormattedTaxonName } from '../../common/FormattedTaxonName';

type Props = {
    taxon: Taxon | null;
    justification: Justification | null;
    loading: boolean;
    onClose: () => void;
    lang: "ja" | "en";
};

const JustificationTable = ({ title, items, icon, color, lang }: { title: string, items: JustificationItem[], icon: React.ReactNode, color: string, lang: "ja" | "en" }) => {
    const T = STR[lang].justificationPanel;
    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, color }}>
                {icon}
                <Typography variant="h6">{title} ({(items || []).length})</Typography>
            </Stack>
            <TableContainer sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>{T.header_trait}</TableCell>
                            <TableCell>{T.header_your_choice}</TableCell>
                            <TableCell>{T.header_taxon_data}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(items || []).map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">{item.traitGroupName}</Typography>
                                    <Typography variant="body2">{item.traitName}</Typography>
                                </TableCell>
                                <TableCell>{item.userChoice}</TableCell>
                                <TableCell>{item.taxonState}</TableCell>
                            </TableRow>
                        ))}
                        {(items || []).length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <Typography variant="caption" color="text.secondary">{T.none}</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
};

export default function JustificationPanel({ taxon, justification, loading, onClose, lang }: Props) {
    const T = STR[lang].justificationPanel;

    if (loading) {
        return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><CircularProgress /></Box>;
    }
    if (!taxon || !justification) {
        return <Typography>{T.no_data}</Typography>;
    }

    return (
        <>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h5" component="h2" sx={{ display: 'inline' }}>{T.title_prefix} </Typography>
                    {/* Use the FormattedTaxonName component here */}
                    <Box sx={{ display: 'inline-block', verticalAlign: 'bottom', ml: 1 }}>
                         <FormattedTaxonName taxon={taxon} lang={lang} />
                    </Box>
                </Box>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                <Chip label={`${T.matches}: ${justification.matchCount}`} color="success" size="small" icon={<CheckCircleIcon />} />
                <Chip label={`${T.conflicts}: ${justification.conflictCount}`} color="error" size="small" icon={<CancelIcon />} />
                <Chip label={`${T.unobserved}: ${justification.unobserved.length}`} size="small" icon={<HelpIcon />} />
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{ flex: 1, minHeight: 0, mt: 1 }}>
                <JustificationTable title={T.matches} items={justification.matches} icon={<CheckCircleIcon />} color="success.main" lang={lang} />
                <JustificationTable title={T.conflicts} items={justification.conflicts} icon={<CancelIcon />} color="error.main" lang={lang} />
                <JustificationTable title={T.unobserved} items={justification.unobserved} icon={<HelpIcon />} color="text.secondary" lang={lang} />
            </Stack>
        </>
    );
}