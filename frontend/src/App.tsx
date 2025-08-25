// frontend/src/App.tsx

import React, { useState, useEffect, useCallback } from "react";
import { 
    CssBaseline, ThemeProvider, createTheme, Box, Tab, Tabs, AppBar, Toolbar, Typography, 
    FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton, Divider, Button, 
    Switch, SelectChangeEvent, Theme, Stack
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import HomeIcon from '@mui/icons-material/Home';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GridOnIcon from '@mui/icons-material/GridOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TuneIcon from '@mui/icons-material/Tune';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { useMatrix } from "./hooks/useMatrix";
import { MatrixEditor } from "./components/tabs/matrix/MatrixEditor";
import HomeTabPanel from "./components/tabs/home/HomeTabPanel";
import { KeyTabPanel } from "./components/tabs/key/KeyTabPanel";
import RibbonSettingsTab from "./components/header/RibbonSettingsTab";
import { STR } from "./i18n";
import { BrowserOpenURL } from "../wailsjs/runtime/runtime";
import { ReportTabPanel } from "./components/tabs/report/ReportTabPanel";
import * as api from '../wailsjs/go/main/App';
import { MatrixData } from "./types";
import MatrixInfoEditorDialog from "./components/header/MatrixInfoEditorDialog";

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

export default function App() {
  const matrixState = useMatrix();
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("dark");
  const [mainTab, setMainTab] = useState('home');
  const [keySubTab, setKeySubTab] = useState('key');
  const T = STR[matrixState.lang];

  const [keysDirectory, setKeysDirectory] = useState<string>('');
  const [currentMatrixData, setCurrentMatrixData] = useState<MatrixData | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [isInfoEditorOpen, setIsInfoEditorOpen] = useState(false);
  
  const fetchKeysDirectory = useCallback(async () => {
    try {
        const path = await api.GetKeysDirectory();
        setKeysDirectory(path);
    } catch (error) {
        console.error('Failed to fetch keys directory:', error);
    }
  }, []);

  useEffect(() => {
    fetchKeysDirectory();
  }, [fetchKeysDirectory]);

  const loadMatrixData = useCallback(async (key: string) => {
    if (!key) {
        setCurrentMatrixData(null);
        return;
    }
    setIsMatrixLoading(true);
    try {
        const data = await api.LoadMatrix(key);
        setCurrentMatrixData(data);
    } catch (error) {
        console.error("Failed to load matrix data in App.tsx:", error);
        setCurrentMatrixData(null);
    } finally {
        setIsMatrixLoading(false);
    }
  }, []);

  useEffect(() => {
      if(matrixState.activeKey) {
        loadMatrixData(matrixState.activeKey);
      } else {
        setCurrentMatrixData(null);
      }
  }, [matrixState.activeKey, loadMatrixData]);

  const handleNewMatrix = async () => {
    const newName = prompt('Enter new matrix file name (e.g., MyNewMatrix.xlsx):');
    if (newName) {
      try {
        await api.CreateNewMatrix(newName);
        await matrixState.refreshKeys();
        const finalName = newName.endsWith('.xlsx') ? newName : newName + '.xlsx';
        matrixState.pickKey(finalName);
        setMainTab('matrix');
      } catch (error) {
        alert(`Failed to create new matrix: ${error}`);
      }
    }
  };
  
  const handleChangeDirectory = async () => {
      try {
          const newPath = await api.SelectKeysDirectory();
          setKeysDirectory(newPath);
          await matrixState.refreshKeys();
          matrixState.pickKey('');
          setCurrentMatrixData(null);
      } catch (error) {
          console.error('Failed to select new directory:', error);
      }
  };

  const handleSaveMatrixInfo = async (newMatrixInfo: string[][]) => {
      if (currentMatrixData && matrixState.activeKey) {
        const newData = { ...currentMatrixData, matrixInfo: newMatrixInfo };
        try {
            await api.SaveMatrix(matrixState.activeKey, newData);
            setCurrentMatrixData(newData);
            alert("Matrix metadata saved successfully!");
        } catch (error) {
            alert("Failed to save matrix metadata.");
        }
      }
  };

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setMainTab(newValue);
  };

  const handleKeySubTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setKeySubTab(newValue);
  };

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: themeMode,
          ...(themeMode === "dark"
            ? {
                background: { default: "#0c111c", paper: "#1f2937" },
                text: { primary: "#e7f0f8", secondary: "#9fb4c7" },
              }
            : {
                background: { default: "#f8f9fa", paper: "#ffffff" },
                text: { primary: "#212529", secondary: "#6c757d" },
              }),
    },
    typography: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: 13,
      h6: { fontWeight: 700 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.default", minHeight: 0 }}>
        <AppBar position="relative" color="default" elevation={0} sx={{ zIndex: (theme: Theme) => theme.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar sx={{ px: 2, minHeight: 48, gap: 1 }}>
                <Typography variant="h6" sx={{ mr: 1, fontWeight: "bold", cursor: 'pointer' }} onClick={() => BrowserOpenURL("https://github.com/soshimizu/identification-key")}>
                    MyKeyLogue
                </Typography>
                <Tabs value={mainTab} onChange={handleMainTabChange} aria-label="main tabs" sx={{minHeight: 48}}>
                    <Tab icon={<HomeIcon />} iconPosition="start" label="HOME" value="home" />
                    <Tab icon={<VpnKeyIcon />} iconPosition="start" label="KEY" value="key" />
                    <Tab icon={<GridOnIcon />} iconPosition="start" label="MATRIX" value="matrix" />
                    <Tab icon={<AssessmentIcon />} iconPosition="start" label="REPORT" value="report" />
                </Tabs>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1} alignItems="center">
                    <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
                        <InputLabel>Language</InputLabel>
                        <Select label="Language" value={matrixState.lang} onChange={(e: SelectChangeEvent<"ja" | "en">) => matrixState.setLang(e.target.value as "ja" | "en")} startAdornment={<TranslateIcon fontSize="small" sx={{mr: 1, color: 'action.active'}}/>}>
                            <MenuItem value="ja">日本語</MenuItem>
                            <MenuItem value="en">English</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title={T.ribbon.switchTheme}>
                        <Switch checked={themeMode === 'dark'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThemeMode(e.target.checked ? 'dark' : 'light')} />
                    </Tooltip>
                </Stack>
            </Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'action.hover', flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{fontWeight: 'bold'}}>Matrix Directory:</Typography>
                <Tooltip title={keysDirectory}>
                    <Typography variant="body2" sx={{
                        fontFamily: 'monospace', bgcolor: 'background.default', px: 1, py: 0.5, borderRadius: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: { xs: 'calc(100vw - 200px)', md: '400px'},
                    }}>
                        {keysDirectory}
                    </Typography>
                </Tooltip>
                <Tooltip title="Change Directory">
                    <IconButton onClick={handleChangeDirectory} size="small"><FolderOpenIcon /></IconButton>
                </Tooltip>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleNewMatrix}>New Matrix</Button>
                    <Tooltip title="Edit Matrix Metadata">
                        <span>
                            <IconButton size="small" onClick={() => setIsInfoEditorOpen(true)} disabled={!matrixState.activeKey || !currentMatrixData}>
                                <EditNoteIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={matrixState.activeKey || ""}>
                        <FormControl size="small" sx={{ minWidth: 200, maxWidth: 350 }}>
                            <InputLabel>{T.ribbon.switchMatrix}</InputLabel>
                            <Select
                                label={T.ribbon.switchMatrix}
                                value={matrixState.activeKey || ""}
                                onChange={(e: SelectChangeEvent<string>) => matrixState.pickKey(String(e.target.value))}
                                renderValue={(selectedValue) => (<Typography noWrap>{selectedValue}</Typography>)}
                            >
                                {(matrixState.keys || []).map((k) => <MenuItem key={k.name} value={k.name}>{k.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Tooltip>
                    <Tooltip title={T.ribbon.refresh_keys}>
                        <IconButton size="small" onClick={matrixState.refreshKeys}><RefreshIcon /></IconButton>
                    </Tooltip>
                </Stack>
            </Box>
        </AppBar>

        <Box sx={{ flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}>
          <Box sx={{ height: "100%", display: mainTab === "home" ? "block" : "none" }}>
            <HomeTabPanel lang={matrixState.lang} />
          </Box>
          <Box sx={{ height: "100%", display: mainTab === "key" ? "flex" : "none", flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
                <Tabs value={keySubTab} onChange={handleKeySubTabChange} aria-label="key-sub-tabs">
                    <Tab icon={<VpnKeyIcon />} iconPosition="start" label="KEY" value="key" />
                    <Tab icon={<TuneIcon />} iconPosition="start" label="SETTINGS" value="settings" />
                </Tabs>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ height: '100%', visibility: keySubTab === 'key' ? 'visible' : 'hidden', position: 'absolute', inset: 0 }}>
                    <KeyTabPanel />
                </Box>
                <Box sx={{ height: '100%', visibility: keySubTab === 'settings' ? 'visible' : 'hidden', position: 'absolute', inset: 0, overflowY: 'auto' }}>
                    <Box sx={{p: 2}}>
                        <RibbonSettingsTab
                            lang={matrixState.lang} matrixName={matrixState.matrixName} algorithm={matrixState.algo}
                            onAlgorithmChange={matrixState.setAlgo} opts={matrixState.opts} setOpts={matrixState.setOpts}
                        />
                    </Box>
                </Box>
            </Box>
          </Box>
          <Box sx={{ height: "100%", display: mainTab === "matrix" ? "block" : "none" }}>
            <MatrixEditor 
                selectedMatrix={matrixState.activeKey || ''}
                matrixData={currentMatrixData}
                onDataChange={setCurrentMatrixData}
                isLoading={isMatrixLoading}
            />
          </Box>
          <Box sx={{ height: "100%", display: mainTab === "report" ? "block" : "none" }}>
            <ReportTabPanel />
          </Box>
        </Box>
        
        {currentMatrixData && (
            <MatrixInfoEditorDialog
                open={isInfoEditorOpen}
                onClose={() => setIsInfoEditorOpen(false)}
                matrixInfo={currentMatrixData.matrixInfo}
                onSave={handleSaveMatrixInfo}
            />
        )}
      </Box>
    </ThemeProvider>
  );
}