import React from 'react';
import { Drawer, Box } from '@mui/material';

interface GraphDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
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
        {children}
      </Box>
    </Drawer>
  );
};
