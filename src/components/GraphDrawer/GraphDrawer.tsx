import React from 'react';
import { Drawer, Box, Typography, Divider } from '@mui/material';
import { EdgeLegend } from '../EdgeLegend/EdgeLegend';
import { FKStats } from '../FKStats/FKStats';
import { GraphEdge } from '../../lib/graph/types';

interface GraphDrawerProps {
  open: boolean;
  onClose: () => void;
  controlsPanel: React.ReactNode;
  edges: GraphEdge[];
}

const DRAWER_WIDTH = 380;

export const GraphDrawer: React.FC<GraphDrawerProps> = ({
  open,
  onClose,
  controlsPanel,
  edges,
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
          {controlsPanel}
        </Box>

        <Divider />

        {/* Legend Section */}
        <Box sx={{ my: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Legend
          </Typography>
          <EdgeLegend />
        </Box>

        <Divider />

        {/* Stats Section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Statistics
          </Typography>
          <FKStats edges={edges} />
        </Box>
      </Box>
    </Drawer>
  );
};
