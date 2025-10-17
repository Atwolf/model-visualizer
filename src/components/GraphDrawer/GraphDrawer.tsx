import React from 'react';
import { Drawer, Box, Typography, Divider, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { EdgeLegend } from '../EdgeLegend/EdgeLegend';
import { FKStats } from '../FKStats/FKStats';
import { GraphEdge } from '../../lib/graph/types';

interface GraphDrawerProps {
  open: boolean;
  onToggle: () => void;
  controlsPanel: React.ReactNode;
  edges: GraphEdge[];
}

const DRAWER_WIDTH = 380;

export const GraphDrawer: React.FC<GraphDrawerProps> = ({
  open,
  onToggle,
  controlsPanel,
  edges,
}) => {
  return (
    <>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
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

      {/* Drawer toggle arrow - attached to drawer edge */}
      <IconButton
        onClick={onToggle}
        aria-label={open ? 'close drawer' : 'open drawer'}
        sx={{
          position: 'fixed',
          top: '50%',
          left: open ? DRAWER_WIDTH : 0,
          transform: 'translateY(-50%)',
          zIndex: 1300,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderLeft: open ? 'none' : undefined,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          width: 28,
          height: 56,
          transition: 'left 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
        }}
      >
        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
    </>
  );
};
