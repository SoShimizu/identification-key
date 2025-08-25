import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, ImageList, ImageListItem, ImageListItemBar, Checkbox, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as api from '../../../../../wailsjs/go/main/App';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '900px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '80vh'
};

interface ImageSelectorModalProps {
  open: boolean;
  onClose: () => void;
  initialSelection: string[];
  onSave: (newSelection: string[]) => void;
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({ open, onClose, initialSelection, onSave }) => {
  const [imageList, setImageList] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set(initialSelection));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      api.ListHelperImages()
        .then(images => setImageList(images || []))
        .catch(err => console.error("Failed to list helper images:", err))
        .finally(() => setIsLoading(false));
      setSelectedImages(new Set(initialSelection));
    }
  }, [open, initialSelection]);

  const handleToggleImage = (imageName: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageName)) {
      newSelection.delete(imageName);
    } else {
      newSelection.add(imageName);
    }
    setSelectedImages(newSelection);
  };

  const handleSave = () => {
    onSave(Array.from(selectedImages).sort());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2">Select Help Images</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', my: 2, border: '1px solid', borderColor: 'divider', p: 1 }}>
          {isLoading ? <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box> : imageList.length > 0 ? (
            <ImageList variant="masonry" cols={4} gap={8}>
              {imageList.map((imageName) => (
                <ImageListItem key={imageName} onClick={() => handleToggleImage(imageName)} sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}>
                  <img
                    src={`http://localhost:34115/assets/${imageName}`} // Wails v2 AssetServerのURL
                    alt={imageName}
                    loading="lazy"
                    style={{ border: selectedImages.has(imageName) ? '3px solid #1976d2' : '3px solid transparent' }}
                  />
                  <ImageListItemBar
                    sx={{ background: 'none' }}
                    position="top"
                    actionIcon={
                      <Checkbox
                        checked={selectedImages.has(imageName)}
                        icon={<></>}
                        checkedIcon={<CheckCircleIcon color="primary" sx={{backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%'}}/>}
                        sx={{ p: 0.5 }}
                      />
                    }
                    actionPosition="left"
                  />
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Typography sx={{textAlign: 'center', p: 4}}>No images found in helper_materi directory.</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save Selection</Button>
        </Box>
      </Box>
    </Modal>
  );
};