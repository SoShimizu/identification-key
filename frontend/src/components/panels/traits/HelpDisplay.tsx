// frontend/src/components/panels/traits/HelpDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Stack } from '@mui/material';
import { Trait } from '../../../api';
import { GetHelpImage } from '../../../../wailsjs/go/main/App';

type Props = {
  trait?: Trait;
};

const ImageWithLoader: React.FC<{ filename: string }> = ({ filename }) => {
    const [imageData, setImageData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        setImageData(null);
        GetHelpImage(filename)
            .then((base64Data: string) => { // ✨ 型をstringに指定
                setImageData(`data:image/png;base64,${base64Data}`);
            })
            .catch((err: any) => { // ✨ 型をanyに指定
                console.error(`Failed to load image ${filename}:`, err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [filename]);

    if (loading) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><CircularProgress size={24} /></Box>;
    if (error) return <Typography variant="caption" color="error">Image not found</Typography>;
    if (imageData) {
        return <img src={imageData} alt={filename} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '4px' }} />;
    }
    return null;
};

export default function HelpDisplay({ trait }: Props) {
  if (!trait) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography color="text.secondary">形質を選択するとここにヘルプが表示されます</Typography>
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Stack spacing={2}>
        <Box>
            <Typography variant="caption" color="text.secondary">{trait.group}</Typography>
            <Typography variant="h6" component="h3">{trait.name}</Typography>
        </Box>
        {trait.helpText && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {trait.helpText}
          </Typography>
        )}
        {trait.helpImages && trait.helpImages.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>参考画像</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trait.helpImages.map((filename: string) => ( // ✨ 型をstringに指定
                    <Box key={filename} sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120 }}>
                        <ImageWithLoader filename={filename} />
                    </Box>
                ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}