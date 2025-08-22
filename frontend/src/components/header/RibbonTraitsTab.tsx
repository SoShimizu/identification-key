// frontend/src/components/header/RibbonTraitsTab.tsx
import React, { useMemo } from "react";
import {
  Box, FormControlLabel, Slider, Stack, Switch, Typography, RadioGroup, Radio, FormControl, Card, CardContent, CardHeader, Divider, Table, TableBody, TableCell, TableRow, TableHead
} from "@mui/material";
import RecommendIcon from '@mui/icons-material/Recommend';
import StraightenIcon from '@mui/icons-material/Straighten';
import HubIcon from '@mui/icons-material/Hub';
import LinkIcon from '@mui/icons-material/Link';
import { AlgoOptions, clampAlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

type Props = {
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonTraitsTab({ opts, setOpts, lang }: Props) {
  const T = STR[lang].traitsTab;
  const saneOpts = useMemo(() => clampAlgoOptions(opts), [opts]);

  const handleBool = (key: keyof AlgoOptions) => (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setOpts(prev => ({ ...prev, [key]: checked }));
  };

  const handleRadio = (key: keyof AlgoOptions) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setOpts(prev => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <Stack direction={{xs: "column", lg: "row"}} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ flex: 1.5, width: '100%' }}>
            <CardHeader avatar={<RecommendIcon color="action" />} title={T.param_recommend.title} titleTypographyProps={{variant: 'h6'}} />
            <CardContent>
                <FormControl component="fieldset" sx={{width: '100%'}}>
                    <Typography variant="subtitle2" gutterBottom>{T.recommendation_strategy.name}</Typography>
                    <RadioGroup row value={opts.recommendationStrategy} onChange={handleRadio("recommendationStrategy")}>
                        <FormControlLabel value="max_ig" control={<Radio size="small" />} label={T.recommendation_strategy.options.breakthrough} />
                        <FormControlLabel value="expected_ig" control={<Radio size="small" />} label={T.recommendation_strategy.options.stable} />
                    </RadioGroup>
                     <Box sx={{ p: 1.5, my: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                        <Table size="small" sx={{'.MuiTableCell-root': { p: 0.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem' }}}>
                           <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{T.recommendation_strategy.table_header_strategy}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{T.recommendation_strategy.table_header_merit}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" sx={{fontWeight: 'bold'}}>{T.recommendation_strategy.table_header_demerit}</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {T.recommendation_strategy.tradeoffs.map(item => (
                                    <TableRow key={item.setting}>
                                        <TableCell><Typography variant="caption" color="text.secondary"><strong>{item.setting}</strong></Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{item.pro}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{item.con}</Typography></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </Box>
                </FormControl>
                <Divider sx={{ my: 1.5 }} />
                <FormControlLabel
                    control={<Switch checked={opts.usePragmaticScore} onChange={handleBool("usePragmaticScore")} />}
                    label={<Typography variant="subtitle2">{T.pragmatic_score.name}</Typography>}
                />
            </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 2, width: '100%' }}>
             <CardHeader avatar={<LinkIcon color="action" />} title="形質の表示・詳細設定" titleTypographyProps={{variant: 'h6'}} />
             <CardContent>
                <FormControlLabel
                    control={<Switch checked={opts.applyDependencies} onChange={handleBool("applyDependencies")} />}
                    label={<Typography variant="subtitle2">依存関係を適用 (推奨)</Typography>}
                />
                 <Box sx={{ p: 1.5, my: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                        有効にすると、親形質の状態が条件を満たさない形質はリストに表示されなくなります。マトリクスに #TraitID と #Dependency 列が必要です。
                    </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                
                <Stack direction={{xs: "column", sm: "row"}} spacing={2} alignItems="flex-start">
                    <Box sx={{flex: 1, width: '100%'}}>
                        <Typography variant="subtitle2" gutterBottom>{T.param_continuous.title}</Typography>
                        <Typography variant="caption">{T.param_tolerance.name}</Typography>
                        <Slider value={saneOpts.toleranceFactor} onChange={(_, v) => setOpts(p => ({ ...p, toleranceFactor: v as number }))} min={0} max={0.5} step={0.01} valueLabelDisplay="auto" valueLabelFormat={v => `${(v*100).toFixed(0)}%`} />
                    </Box>
                    <Box sx={{flex: 1, width: '100%'}}>
                        <Typography variant="subtitle2" gutterBottom>{T.param_multi.title}</Typography>
                        <FormControl>
                            <RadioGroup row value={opts.categoricalAlgo} onChange={handleRadio("categoricalAlgo")}>
                                <FormControlLabel value="binary" control={<Radio size="small" />} label="Binary" />
                                <FormControlLabel value="jaccard" control={<Radio size="small" />} label="Jaccard" />
                            </RadioGroup>
                        </FormControl>
                        <Box sx={{opacity: opts.categoricalAlgo === 'jaccard' ? 1 : 0.5}}>
                            <Typography variant="caption">{T.jaccard_threshold.name}</Typography>
                            <Slider disabled={opts.categoricalAlgo !== 'jaccard'} value={saneOpts.jaccardThreshold} onChange={(_, v) => setOpts(p => ({ ...p, jaccardThreshold: v as number }))} min={0} max={1} step={0.01} valueLabelDisplay="auto" />
                        </Box>
                    </Box>
                </Stack>
             </CardContent>
        </Card>
    </Stack>
  );
}