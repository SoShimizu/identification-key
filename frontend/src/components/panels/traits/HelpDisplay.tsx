// frontend/src/components/panels/traits/HelpDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Stack, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trait } from '../../../api';
import { GetHelpImage } from '../../../../wailsjs/go/main/App';
import { STR } from '../../../i18n';

type Props = {
  trait?: Trait;
  lang: "ja" | "en";
};

const ImageWithLoader: React.FC<{ filename: string; onClick: () => void }> = ({ filename, onClick }) => {
    const [imageData, setImageData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        setImageData(null);
        GetHelpImage(filename)
            .then((base64Data: string) => {
                if (base64Data) {
                    setImageData(`data:image/png;base64,${base64Data}`);
                } else {
                    setError(true);
                }
            })
            .catch((err: any) => {
                console.error(`Failed to load image ${filename}:`, err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [filename]);

    if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}><CircularProgress size={24} /></Box>;
    if (error) return <Typography variant="caption" color="error">Image not found</Typography>;
    if (imageData) {
        return (
            <Box onClick={onClick} sx={{ cursor: 'pointer' }}>
                <img src={imageData} alt={filename} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
            </Box>
        );
    }
    return null;
};

export default function HelpDisplay({ trait, lang }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const T = STR[lang].panels;

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

  const hasHelpContent = (trait.helpText && trait.helpText.trim() !== "") || (trait.helpImages && trait.helpImages.length > 0);

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
        <Stack spacing={2}>
          <Box>
              <Typography variant="caption" color="text.secondary">{trait.group}</Typography>
              <Typography variant="h6" component="h3">{trait.name}</Typography>
          </Box>
          
          {!hasHelpContent && (
              <Typography color="text.secondary">この形質に関する補助材料はありません。</Typography>
          )}

          {trait.helpText && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {trait.helpText}
            </Typography>
          )}
          {trait.helpImages && trait.helpImages.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>参考画像</Typography>
              <Stack spacing={1}>
                  {trait.helpImages.map((filename: string) => (
                      <Box key={filename}>
                          <ImageWithLoader filename={filename} onClick={() => handleImageClick(filename)} />
                      </Box>
                  ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
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