import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

const STORAGE_KEY = 'modelVisualizer_hideIntro';

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ open, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 500,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.4rem', pb: 0 }}>
        Nautobot Model Visualizer
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Visualize relationships between Nautobot data models as an interactive
          graph.
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          How to use
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, mt: 0, mb: 2, '& li': { mb: 0.75 } }}>
          <li>
            <Typography variant="body2">
              Open the side panel by clicking the arrow on the left edge.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Select a <strong>Root Type</strong> -- this is the starting node
              for the graph.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Adjust <strong>Depth</strong> to control how many relationship
              hops to show.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Use <strong>Type Filter</strong> to include/exclude specific model
              categories (
              <Box component="span" sx={{ color: '#1976d2', fontWeight: 500 }}>DCIM</Box>,{' '}
              <Box component="span" sx={{ color: '#2e7d32', fontWeight: 500 }}>IPAM</Box>,{' '}
              <Box component="span" sx={{ color: '#ed6c02', fontWeight: 500 }}>Circuits</Box>
              ).
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Toggle <strong>FK edges only</strong> to see only foreign-key
              relationships.
            </Typography>
          </li>
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Interaction tips
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Pan by dragging the canvas. Zoom with scroll. Hover edges for details.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don't show this again
            </Typography>
          }
        />
        <Button variant="contained" onClick={handleClose} disableElevation>
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
};
