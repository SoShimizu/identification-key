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

type Props = {
    taxon: Taxon | null;
    justification: Justification | null;
    loading: boolean;
    onClose: () => void;
    lang: "ja" | "en";
};

const JustificationTable = ({ title, items, icon, color }: { title: string, items: JustificationItem[], icon: React.ReactNode, color: string }) => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, color }}>
            {icon}
            <Typography variant="h6">{title} ({(items || []).length})</Typography>
        </Stack>
        <TableContainer sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>Trait</TableCell>
                        <TableCell>Your Choice</TableCell>
                        <TableCell>Taxon Data</TableCell>
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
                                <Typography variant="caption" color="text.secondary">None</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

export default function JustificationPanel({ taxon, justification, loading, onClose, lang }: Props) {
    if (loading) {
        return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><CircularProgress /></Box>;
    }
    if (!taxon || !justification) {
        return <Typography>No data available.</Typography>;
    }

    return (
        <>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" component="h2">Justification for: <strong>{taxon.name}</strong></Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                <Chip label={`Matches: ${justification.matchCount}`} color="success" size="small" icon={<CheckCircleIcon />} />
                <Chip label={`Conflicts: ${justification.conflictCount}`} color="error" size="small" icon={<CancelIcon />} />
                <Chip label={`Unobserved: ${justification.unobserved.length}`} size="small" icon={<HelpIcon />} />
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{ flex: 1, minHeight: 0, mt: 1 }}>
                <JustificationTable title="Matching Evidence" items={justification.matches} icon={<CheckCircleIcon />} color="success.main" />
                <JustificationTable title="Conflicting Evidence" items={justification.conflicts} icon={<CancelIcon />} color="error.main" />
                <JustificationTable title="Unobserved Traits" items={justification.unobserved} icon={<HelpIcon />} color="text.secondary" />
            </Stack>
        </>
    );
}