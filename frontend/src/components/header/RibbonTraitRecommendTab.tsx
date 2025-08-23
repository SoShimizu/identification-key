// frontend/src/components/header/RibbonTraitRecommendTab.tsx
import React from "react";
import {
  Box, FormControlLabel, Stack, Switch, Typography, RadioGroup, Radio, FormControl, Card, CardContent, CardHeader, Divider, Table, TableBody, TableCell, TableRow, TableHead
} from "@mui/material";
import RecommendIcon from '@mui/icons-material/Recommend';
import LinkIcon from '@mui/icons-material/Link';
import { AlgoOptions } from "../../hooks/useAlgoOpts";
import { STR } from "../../i18n";

type Props = {
  opts: AlgoOptions;
  setOpts: React.Dispatch<React.SetStateAction<AlgoOptions>>;
  lang: "ja" | "en";
};

export default function RibbonTraitRecommendTab({ opts, setOpts, lang }: Props) {
  const T = STR[lang].traitsTab;

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
                        <Table size="small" sx={{'.MuiTableCell-root': { p: 0.5, borderBottom: 'none', fontSize: '0.75rem' }}}>
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
                 <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>{T.pragmatic_score.description}</Typography>
            </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
             <CardHeader avatar={<LinkIcon color="action" />} title={T.param_dependencies.title} titleTypographyProps={{variant: 'h6'}} />
             <CardContent>
                <FormControlLabel
                    control={<Switch checked={opts.applyDependencies} onChange={handleBool("applyDependencies")} />}
                    label={<Typography variant="subtitle2">{T.param_dependencies.name}</Typography>}
                />
                 <Box sx={{ p: 1.5, my: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                        {T.param_dependencies.description}
                    </Typography>
                </Box>
             </CardContent>
        </Card>
    </Stack>
  );
}