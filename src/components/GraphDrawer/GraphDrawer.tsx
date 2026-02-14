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
  const [aboutExpanded, setAboutExpanded] = useState(true);
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
              {/* Data Sources */}
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                Data Sources
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <Box sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb', display: 'block', mb: 0.25 }}>
                    GraphQL
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                    Schema introspection for models &amp; relationships
                  </Typography>
                </Box>
                <Box sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', display: 'block', mb: 0.25 }}>
                    PostgreSQL
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                    FK constraints, direction &amp; cardinality
                  </Typography>
                </Box>
              </Box>

              {/* How the graph is built - mini diagram */}
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                Graph Building
              </Typography>
              <Box sx={{
                p: 1.25,
                borderRadius: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                mb: 1.5,
              }}>
                {/* Mini node diagram */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {/* Root node mini */}
                  <Box sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '6px',
                    backgroundColor: '#4A90E2',
                    border: '2px solid #2E5C8A',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    Root Model
                  </Box>
                  {/* Arrow */}
                  <svg width="30" height="12" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="6" x2="22" y2="6" stroke="#2563eb" strokeWidth="2" />
                    <path d="M22,2 L30,6 L22,10 z" fill="#2563eb" />
                  </svg>
                  {/* Child node mini */}
                  <Box sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    border: '2px solid #CCCCCC',
                    color: '#333',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                  }}>
                    Related
                  </Box>
                  {/* Arrow */}
                  <svg width="30" height="12" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="6" x2="22" y2="6" stroke="#10b981" strokeWidth="2" strokeDasharray="4,3" />
                    <path d="M22,2 L30,6 L22,10 z" fill="#10b981" />
                  </svg>
                  {/* Another child */}
                  <Box sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    border: '2px solid #CCCCCC',
                    color: '#333',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                  }}>
                    ...
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                  Select a root model, then traverse breadth-first to a configurable depth.
                </Typography>
              </Box>

              {/* Edge types inline */}
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                Edge Types
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg width="36" height="10" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="5" x2="28" y2="5" stroke="#2563eb" strokeWidth="2" />
                    <path d="M28,2 L36,5 L28,8 z" fill="#2563eb" />
                  </svg>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Forward FK (many-to-one)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg width="36" height="10" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="5" x2="28" y2="5" stroke="#10b981" strokeWidth="2" strokeDasharray="4,3" />
                    <path d="M28,2 L36,5 L28,8 z" fill="#10b981" />
                  </svg>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Reverse (one-to-many)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg width="36" height="10" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                    <path d="M28,2 L36,5 L28,8 z" fill="#94a3b8" />
                  </svg>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    GraphQL only (non-FK)
                  </Typography>
                </Box>
              </Box>

              {/* App categories */}
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                App Filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                {[
                  { label: 'DCIM', color: '#1976d2' },
                  { label: 'IPAM', color: '#2e7d32' },
                  { label: 'Circuits', color: '#ed6c02' },
                ].map((app) => (
                  <Box
                    key={app.label}
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: '10px',
                      backgroundColor: app.color,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {app.label}
                  </Box>
                ))}
              </Box>
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
