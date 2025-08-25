// soshimizu/key-testa/key-testA-eececee799c6cbc1a9ab195da73ad52495f23149/frontend/src/App.tsx

import React, { useState } from "react";
import { CssBaseline, ThemeProvider, createTheme, Box, Tab, Tabs } from "@mui/material";
import { useMatrix } from "./hooks/useMatrix";
import Ribbon from "./components/header/Ribbon";
import { KeyTabPanel } from "./components/tabs/key/KeyTabPanel";
import { MatrixEditor } from "./components/tabs/matrix/MatrixEditor";

// フォントの読み込み
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

export default function App() {
  const matrixState = useMatrix();
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("dark");
  const [currentTab, setCurrentTab] = useState('key');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const theme = React.useMemo(
    () =>
      createTheme({
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
      }),
    [themeMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* ルート。高さを確定 + Flex 縦並び。minHeight:0 を明示して子の overflow を有効化 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "background.default",
          minHeight: 0,
        }}
      >
        <Ribbon
          {...matrixState}
          onPickKey={matrixState.pickKey}
          onRefreshKeys={matrixState.refreshKeys}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
        />

        {/* タブバーは固定行 */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="main tabs">
            <Tab label="KEY" value="key" />
            <Tab label="MATRIX" value="matrix" />
          </Tabs>
        </Box>

        {/* ★ 中央領域。ここに minHeight:0 を入れるのが超重要 */}
        <Box
          sx={{
            flex: "1 1 0%",
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* KEYタブ */}
          <Box sx={{ height: "100%", minHeight: 0, display: currentTab === "key" ? "block" : "none" }}>
            <KeyTabPanel />
          </Box>

          {/* MATRIXタブ */}
          <Box sx={{ height: "100%", minHeight: 0, display: currentTab === "matrix" ? "block" : "none" }}>
            <MatrixEditor />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
