import React, { useState } from 'react';
import { Drawer, Box, Typography, Divider, IconButton, Collapse } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

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
          {/* Application Title */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Nautobot Model Visualizer
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Interactive graph visualization of Nautobot data model relationships.
          </Typography>

          {/* About Section - Collapsible */}
          <Box
            onClick={() => setAboutExpanded(!aboutExpanded)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.75,
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 1,
              px: 1,
              mx: -1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              About
            </Typography>
            <IconButton size="small" tabIndex={-1}>
              {aboutExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={aboutExpanded}>
            <Box sx={{ pb: 1.5, pt: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, lineHeight: 1.6 }}>
                This tool visualizes how Nautobot data models relate to each other by
                combining two data sources:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0, mb: 1, '& li': { mb: 0.5 } }}>
                <li>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    <strong>GraphQL introspection</strong> &mdash; queries the Nautobot API schema
                    to discover models and their field-level relationships.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    <strong>PostgreSQL foreign keys</strong> &mdash; parsed from a database export
                    to identify true FK constraints, direction, and cardinality.
                  </Typography>
                </li>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                The graph is built by selecting a root model and traversing its relationships
                breadth-first up to a configurable depth. Edges are color-coded to distinguish
                forward FKs, reverse relations, and GraphQL-only fields.
              </Typography>
            </Box>
          </Collapse>

          <Divider sx={{ mb: 1.5 }} />

          {/* Controls Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Controls
            </Typography>
            {controlsPanel}
          </Box>

          <Divider />

          {/* Legend Section - Collapsible */}
          <Box
            onClick={() => setLegendExpanded(!legendExpanded)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.75,
              mt: 0.5,
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 1,
              px: 1,
              mx: -1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Edge Legend
            </Typography>
            <IconButton size="small" tabIndex={-1}>
              {legendExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={legendExpanded}>
            <Box sx={{ pb: 1.5, pt: 0.5 }}>
              <EdgeLegend />
            </Box>
          </Collapse>

          <Divider />

          {/* Statistics Section - Collapsible */}
          <Box
            onClick={() => setStatsExpanded(!statsExpanded)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.75,
              mt: 0.5,
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 1,
              px: 1,
              mx: -1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Statistics
            </Typography>
            <IconButton size="small" tabIndex={-1}>
              {statsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={statsExpanded}>
            <Box sx={{ pb: 1.5, pt: 0.5 }}>
              <FKStats edges={edges} />
            </Box>
          </Collapse>

          {/* Interaction Tips */}
          <Divider sx={{ mt: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5, lineHeight: 1.5 }}>
            Pan by dragging the canvas. Zoom with scroll. Edge colors indicate FK direction.
          </Typography>
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
