// frontend/src/components/panels/traits/HelpDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid, Modal, IconButton, Tabs, Tab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trait } from '../../../api';
import { GetHelpImage } from '../../../../wailsjs/go/main/App';
import { STR } from '../../../i18n';

type Props = {
  trait?: Trait;
  lang: "ja" | "en";
};

const HtmlRenderer: React.FC<{ content: string }> = ({ content }) => {
    return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />;
};

const ImageWithLoader: React.FC<{ filename: string; onClick: () => void }> = ({ filename, onClick }) => {
    // ... (implementation unchanged)
    const [imageData, setImageData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setImageData(null);
        GetHelpImage(filename)
            .then((base64Data: string) => {
                if (base64Data) {
                    setImageData(`data:image/png;base64,${base64Data}`);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [filename]);

    if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, width: '100%', bgcolor: 'action.hover', borderRadius: 1 }}><CircularProgress size={24} /></Box>;
    if (!imageData) return null;

    return (
        <Box onClick={onClick} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <img src={imageData} alt={filename} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
        </Box>
    );
};

export default function HelpDisplay({ trait, lang }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  const T = STR[lang].panels;
  
  const helpText = lang === 'ja' ? trait?.helpText_jp : trait?.helpText_en;

  const tabs = [];
  if (helpText) tabs.push("Note");
  if (trait?.helpImages && trait.helpImages.length > 0 && trait.helpImages[0] !== "") tabs.push("Images");
  
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
      setActiveTab(0);
  }, [trait]);


  const handleImageClick = (filename: string) => {
    GetHelpImage(filename).then(base64Data => {
        if(base64Data) {
            setModalImage(`data:image/png;base64,${base64Data}`);
            setModalOpen(true);
        }
    });
  };

  if (!trait) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography color="text.secondary">{T.help_placeholder}</Typography>
      </Box>
    );
  }

  const hasHelpContent = tabs.length > 0;

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{flexShrink: 0}}>
            <Typography variant="caption" color="text.secondary">{lang === 'ja' ? trait.group_jp : trait.group_en}</Typography>
            <Typography variant="h6" component="h3">{lang === 'ja' ? trait.name_jp : trait.name_en}</Typography>
        </Box>
        
        {!hasHelpContent ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">この形質に関する補助材料はありません。</Typography>
            </Box>
        ) : (
            <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1, flexShrink: 0 }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
                        {tabs.map(label => <Tab key={label} label={label} />)}
                    </Tabs>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
                    {tabs[activeTab] === "Note" && helpText && (
                        <HtmlRenderer content={helpText} />
                    )}
                    {tabs[activeTab] === "Images" && trait.helpImages && (
                        <Grid container spacing={2}>
                            {trait.helpImages.map((filename: string) => (
                                <Grid item xs={12} sm={6} md={4} key={filename}>
                                    <ImageWithLoader filename={filename} onClick={() => handleImageClick(filename)} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </>
        )}
      </Paper>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative', maxHeight: '90vh', maxWidth: '90vw' }}>
            <IconButton onClick={() => setModalOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
                <CloseIcon />
            </IconButton>
            <img src={modalImage || ''} alt="Enlarged view" style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
        </Box>
      </Modal>
    </>
  );
}