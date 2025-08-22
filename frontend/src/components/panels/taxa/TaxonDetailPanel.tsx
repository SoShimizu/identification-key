// frontend/src/components/panels/taxa/TaxonDetailPanel.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Stack, Modal, IconButton, Tabs, Tab, Grid, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Taxon } from '../../../api';
import { GetHelpImage } from '../../../../wailsjs/go/main/App';

const ImageWithLoader: React.FC<{ filename: string; onClick: () => void }> = ({ filename, onClick }) => {
    const [imageData, setImageData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setImageData(null);
        GetHelpImage(filename)
            .then((base64Data: string) => {
                if (base64Data) setImageData(`data:image/png;base64,${base64Data}`);
            })
            .finally(() => setLoading(false));
    }, [filename]);

    if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, width: '100%', bgcolor: 'action.hover', borderRadius: 1 }}><CircularProgress size={24} /></Box>;
    if (!imageData) return null;

    return (
        <Box onClick={onClick} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <img src={imageData} alt={filename} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
        </Box>
    );
};

// Component to safely render HTML content with left alignment
const HtmlRenderer: React.FC<{ content: string }> = ({ content }) => {
    return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: content }} />;
};


export default function TaxonDetailPanel({ taxon }: { taxon: Taxon }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  const tabs = [];
  if (taxon.description) tabs.push("Description");
  if (taxon.references) tabs.push("References");
  if (taxon.images && taxon.images.length > 0) tabs.push("Images");

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
      setActiveTab(0);
  }, [taxon]);


  const handleImageClick = (filename: string) => {
    GetHelpImage(filename).then(base64Data => {
        if(base64Data) {
            setModalImage(`data:image/png;base64,${base64Data}`);
            setModalOpen(true);
        }
    });
  };
  
  const hasContent = tabs.length > 0;

  return (
    <>
      <Paper variant="outlined" sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h3" sx={{ flexShrink: 0 }}>{taxon.name}</Typography>
        <Divider sx={{ my: 1, flexShrink: 0 }} />
        
        {!hasContent ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Typography color="text.secondary">No detailed information available for this taxon.</Typography>
            </Box>
        ) : (
            <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
                       {tabs.map(label => <Tab key={label} label={label} />)}
                    </Tabs>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
                    {tabs[activeTab] === "Description" && <HtmlRenderer content={taxon.description || ''} />}
                    {tabs[activeTab] === "References" && <HtmlRenderer content={taxon.references || ''} />}
                    {tabs[activeTab] === "Images" && taxon.images && (
                         <Grid container spacing={2}>
                            {taxon.images.map(filename => (
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
            <IconButton onClick={() => setModalOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': {bgcolor: 'rgba(0,0,0,0.8)'} }}>
                <CloseIcon />
            </IconButton>
            <img src={modalImage || ''} alt="Enlarged view" style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
        </Box>
      </Modal>
    </>
  );
}