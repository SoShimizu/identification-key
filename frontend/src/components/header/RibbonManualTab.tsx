// frontend/src/components/header/RibbonManualTab.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { STR } from "../../i18n";

// A simple markdown-like renderer
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    return (
        <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>
            {text.split('\n').map((line, index) => {
                if (line.startsWith('### ')) {
                    return <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1 }}>{line.substring(4)}</Typography>;
                }
                if (line.startsWith('## ')) {
                    return <Typography key={index} variant="h5" sx={{ mt: 3, mb: 1 }}>{line.substring(3)}</Typography>;
                }
                if (line.startsWith('# ')) {
                    return <Typography key={index} variant="h4" sx={{ mt: 4, mb: 2 }}>{line.substring(2)}</Typography>;
                }
                if (line.startsWith('- ')) {
                    return <Typography key={index} variant="body2" component="p" sx={{ ml: 2, textIndent: '-1.5em' }}>• {line.substring(2)}</Typography>;
                }
                return <Typography key={index} variant="body2" component="p">{line || ' '}</Typography>;
            })}
        </Box>
    );
};


type Props = {
  lang: "ja" | "en";
};

export default function RibbonManualTab({ lang }: Props) {
  const T = STR[lang].manualTab;

  return (
    <Box sx={{ maxHeight: '50vh', overflowY: 'auto', p: 1 }}>
        <SimpleMarkdown text={T.content} />
    </Box>
  );
}