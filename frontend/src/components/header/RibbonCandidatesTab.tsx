// frontend/src/components/header/RibbonCandidatesTab.tsx
import React, { useMemo } from "react";
import {
  Box, Divider, FormControl, InputLabel,
  MenuItem, Select, SelectChangeEvent, Slider, Stack, Typography, Button, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableRow, TableHead
} from "@mui/material";
import GavelIcon from '@mui/icons-material/Gavel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ScienceIcon from '@mui/icons-material/Science';
import { useAlgoOpts, AlgoOptions, clampAlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

// A helper component for a setting item within a card
const SettingItem = ({ title, description, effect, tradeoffs, children, lang = "ja" }: {
    title: string;
    description: string;
    effect: string;
    tradeoffs: readonly { setting: string; pro: string; con: string; }[];
    children: React.ReactNode;
    lang?: "ja" | "en";
}) => (
    <Box>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        {children}
        <Box sx={{ p: 1.5, mt: 1, borderRadius: 1, bgcolor: 'action.hover', fontSize: '0.75rem' }}>
             <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
                {description}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
                <strong>{STR[lang].candidatesTab.effect_label}:</strong> {effect}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
                <strong>{STR[lang].candidatesTab.tradeoff_label}:</strong>
            </Typography>
            <Table size="small" sx={{'.MuiTableCell-root': { p: 0.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem' }}}>
                <TableHead>
                    <TableRow>
                        <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{STR[lang].candidatesTab.table_header_setting}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{STR[lang].candidatesTab.table_header_merit}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{STR[lang].candidatesTab.table_header_demerit}</Typography></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tradeoffs.map(item => (
                        <TableRow key={item.setting}>
                            <TableCell><Typography variant="caption" color="text.secondary"><strong>{item.setting}</strong></Typography></TableCell>
                            <TableCell><Typography variant="caption" color="text.secondary">{item.pro}</Typography></TableCell>
                            <TableCell><Typography variant="caption" color="text.secondary">{item.con}</Typography></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    </Box>
);

type Props = {
  matrixName: string;
  algorithm?: "bayes" | "heuristic";
  onAlgorithmChange?: (algo: "bayes" | "heuristic") => void;
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonCandidatesTab(props: Props) {
  const {
    matrixName, lang,
    algorithm = "bayes", onAlgorithmChange,
    opts, setOpts,
  } = props;

  const T = STR[lang].candidatesTab;
  const { reset } = useAlgoOpts(matrixName);
  const saneOpts = useMemo(() => clampAlgoOptions(opts), [opts]);

  return (
    <Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{T.algorithm}</InputLabel>
            <Select label={T.algorithm} value={algorithm} onChange={(e: SelectChangeEvent) => onAlgorithmChange?.(e.target.value as any)}>
                <MenuItem value="bayes">Bayes</MenuItem>
                <MenuItem value="heuristic">Heuristic</MenuItem>
            </Select>
            </FormControl>
            <Button variant="text" onClick={reset} >{T.reset_defaults}</Button>
        </Stack>

        {algorithm === 'bayes' ? (
            <Stack direction={{xs: "column", md: "row"}} spacing={2} alignItems="flex-start">
                <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
                    <CardHeader avatar={<GavelIcon color="action" />} titleTypographyProps={{variant: 'h6'}} title={T.param_conflict.title} />
                    <CardContent>
                        <SettingItem lang={lang} title={T.param_conflict.name} description={T.param_conflict.description} effect={T.param_conflict.effect} tradeoffs={T.param_conflict.tradeoffs}>
                            <Box sx={{ px: 1}}>
                                <Slider min={0} max={1} step={0.01} value={saneOpts.conflictPenalty} onChange={(_, v) => setOpts(p => ({...p, conflictPenalty: v as number}))} valueLabelDisplay="auto" />
                                <Stack direction="row" justifyContent="space-between"><Typography variant="caption">0.0 (Lenient)</Typography><Typography variant="caption">1.0 (Strict)</Typography></Stack>
                            </Box>
                        </SettingItem>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
                     <CardHeader avatar={<ReportProblemIcon color="action" />} titleTypographyProps={{variant: 'h6'}} title={T.param_na.title} />
                    <CardContent>
                        <SettingItem lang={lang} title={T.param_na.name} description={T.param_na.description} effect={T.param_na.effect} tradeoffs={T.param_na.tradeoffs}>
                            <Box sx={{ px: 1}}>
                                <Slider min={0.0} max={1.0} step={0.01} value={saneOpts.gammaNAPenalty} onChange={(_, v) => setOpts(p => ({...p, gammaNAPenalty: v as number}))} valueLabelDisplay="auto"/>
                                <Stack direction="row" justifyContent="space-between"><Typography variant="caption">0.0 (Strong Penalty)</Typography><Typography variant="caption">1.0 (No Penalty)</Typography></Stack>
                            </Box>
                        </SettingItem>
                    </CardContent>
                </Card>

                 <Card variant="outlined" sx={{ flex: 1.5, width: '100%' }}>
                     <CardHeader avatar={<ScienceIcon color="action" />} titleTypographyProps={{variant: 'h6'}} title={T.param_bayes.title} />
                    <CardContent>
                        <Stack spacing={3}>
                             <SettingItem lang={lang} title={T.param_kappa.name} description={T.param_kappa.description} effect={T.param_kappa.effect} tradeoffs={T.param_kappa.tradeoffs}>
                                <Box sx={{ px: 1}}>
                                    <Slider min={0} max={5} step={0.1} value={saneOpts.kappa} onChange={(_, v) => setOpts(p => ({...p, kappa: v as number}))} valueLabelDisplay="auto"/>
                                    <Stack direction="row" justifyContent="space-between"><Typography variant="caption">0.0</Typography><Typography variant="caption">5.0</Typography></Stack>
                                </Box>
                            </SettingItem>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <Box sx={{flex: 1}}>
                                    <Typography variant="subtitle2">{T.param_alpha.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{T.param_alpha.description}</Typography>
                                    <Box sx={{px: 1, mt: 1}}>
                                        <Slider size="small" min={0} max={0.2} step={0.005} value={saneOpts.defaultAlphaFP} onChange={(_, v) => setOpts(p => ({ ...p, defaultAlphaFP: v as number }))} valueLabelDisplay="auto"/>
                                        <Stack direction="row" justifyContent="space-between"><Typography variant="caption">0.0</Typography><Typography variant="caption">0.2</Typography></Stack>
                                    </Box>
                                </Box>
                                <Box sx={{flex: 1}}>
                                    <Typography variant="subtitle2">{T.param_beta.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{T.param_beta.description}</Typography>
                                    <Box sx={{px: 1, mt: 1}}>
                                        <Slider size="small" min={0} max={0.2} step={0.005} value={saneOpts.defaultBetaFN} onChange={(_, v) => setOpts(p => ({ ...p, defaultBetaFN: v as number }))} valueLabelDisplay="auto"/>
                                        <Stack direction="row" justifyContent="space-between"><Typography variant="caption">0.0</Typography><Typography variant="caption">0.2</Typography></Stack>
                                    </Box>
                                </Box>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        ) : (
            <Typography variant="body2" color="text.secondary">
                {lang === 'ja' ? 'ヒューリスティックモードは、矛盾のない候補を単純な一致率でスコアリングします。設定は不要です。' : 'Heuristic mode scores candidates by simple match rate, excluding those with conflicts. No parameters are needed.'}
            </Typography>
        )}
    </Box>
  );
}