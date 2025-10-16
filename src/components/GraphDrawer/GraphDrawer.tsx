import React from 'react';
import { Drawer, Box, Typography, Divider } from '@mui/material';

interface GraphDrawerProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const DRAWER_WIDTH = 380;

export const GraphDrawer: React.FC<GraphDrawerProps> = ({
  open,
  onClose,
  children,
}) => {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflow: 'auto',
          p: 2,
        }}
      >
        {/* Controls Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Controls
          </Typography>
          {/* Placeholder for controls - will be populated in next steps */}
        </Box>

        <Divider />

        {/* Legend Section */}
        <Box sx={{ my: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Legend
          </Typography>
          {/* Placeholder for legend - will be populated in next steps */}
        </Box>

        <Divider />

        {/* Stats Section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Statistics
          </Typography>
          {/* Placeholder for statistics - will be populated in next steps */}
        </Box>
      </Box>
    </Drawer>
  );
};
