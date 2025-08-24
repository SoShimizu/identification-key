// frontend/src/components/panels/taxa/TaxonDetailPanel.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid, Modal, IconButton, Tabs, Tab, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Taxon } from '../../../api';
import { GetHelpImage } from '../../../../wailsjs/go/main/App.js';

const ImageWithLoader: React.FC<{ filename: string; onClick: () => void }> = ({ filename, onClick }) => {
    const [imageData, setImageData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setImageData(null);
        if (filename) {
            GetHelpImage(filename)
                .then((base64Data: string) => {
                    if (base64Data) setImageData(`data:image/png;base64,${base64Data}`);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [filename]);

    if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, width: '100%', bgcolor: 'action.hover', borderRadius: 1 }}><CircularProgress size={24} /></Box>;
    if (!imageData) return null;

    return (
        <Box onClick={onClick} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <img src={imageData} alt={filename} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
        </Box>
    );
};

const HtmlRenderer: React.FC<{ content: string }> = ({ content }) => {
    return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: content }} />;
};

// Reusable component for displaying taxon names correctly
export const FormattedScientificName: React.FC<{ taxon: Taxon, lang: 'ja' | 'en' }> = ({ taxon, lang }) => {
    const genus = taxon.genus || '';
    const subgenus = taxon.subgenus ? `(${taxon.subgenus})` : '';
    const species = taxon.species || '';
    const subspecies = taxon.subspecies || '';
    
    const vernacularName = lang === 'ja' ? taxon.vernacularName_ja || taxon.vernacularName_en : taxon.vernacularName_en || taxon.vernacularName_ja;

    return (
        <Box>
            <Typography variant="body1" component="div">
                {genus && <i>{genus} </i>}
                {subgenus && <i>{subgenus} </i>}
                {species && <i>{species} </i>}
                {subspecies && <i>{subspecies} </i>}
                {taxon.taxonAuthor && <Typography variant="body2" component="span">{taxon.taxonAuthor}</Typography>}
            </Typography>
            {vernacularName && <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>{vernacularName}</Typography>}
        </Box>
    );
};


export default function TaxonDetailPanel({ taxon, lang }: { taxon: Taxon, lang: "ja" | "en" }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  const description = lang === 'ja' ? taxon.description_jp || taxon.description_en : taxon.description_en || taxon.description_jp;
  const references = taxon.references;
  
  const tabs = [];
  if (description) tabs.push(lang === 'ja' ? "解説" : "Description");
  tabs.push(lang === 'ja' ? "分類" : "Taxonomy");
  if (taxon.images && taxon.images.length > 0 && taxon.images.filter(img => img.trim() !== "").length > 0) tabs.push(lang === 'ja' ? "画像" : "Images");
  if (references) tabs.push(lang === 'ja' ? "文献" : "References");

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
  
  const ranks = [
      { label: 'Order', value: taxon.order },
      { label: 'Superfamily', value: taxon.superfamily },
      { label: 'Family', value: taxon.family },
      { label: 'Subfamily', value: taxon.subfamily },
      { label: 'Tribe', value: taxon.tribe },
      { label: 'Subtribe', value: taxon.subtribe },
      { label: 'Genus', value: taxon.genus },
      { label: 'Subgenus', value: taxon.subgenus },
      { label: 'Species', value: taxon.species },
      { label: 'Subspecies', value: taxon.subspecies },
  ].filter(rank => rank.value);


  return (
    <>
      <Paper variant="outlined" sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{flexShrink: 0}}>
            <FormattedScientificName taxon={taxon} lang={lang} />
        </Box>
        <Divider sx={{ my: 1, flexShrink: 0 }} />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto" aria-label="taxon detail tabs">
                {tabs.map(label => <Tab key={label} label={label} />)}
            </Tabs>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
            {tabs[activeTab] === (lang === 'ja' ? "解説" : "Description") && <HtmlRenderer content={description || ''} />}
            {tabs[activeTab] === (lang === 'ja' ? "分類" : "Taxonomy") && (
                <List dense>
                    {ranks.map(rank => (
                        <ListItem key={rank.label} sx={{py: 0.5}}>
                            <Chip label={rank.label} size="small" sx={{mr: 2, minWidth: '90px'}}/>
                            <ListItemText primaryTypographyProps={{ sx: { fontStyle: ['Genus', 'Subgenus', 'Species', 'Subspecies'].includes(rank.label) ? 'italic' : 'normal' } }} primary={rank.value} />
                        </ListItem>
                    ))}
                </List>
            )}
            {tabs[activeTab] === (lang === 'ja' ? "文献" : "References") && <HtmlRenderer content={references || ''} />}
            {tabs[activeTab] === (lang === 'ja' ? "画像" : "Images") && taxon.images && (
                    <Grid container spacing={2}>
                    {taxon.images.filter(f => f.trim() !== "").map(filename => (
                        <Grid item xs={12} sm={6} md={4} key={filename}>
                            <ImageWithLoader filename={filename} onClick={() => handleImageClick(filename)} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
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