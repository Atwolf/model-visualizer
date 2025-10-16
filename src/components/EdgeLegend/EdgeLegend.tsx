/**
 * EdgeLegend - Visual legend explaining edge type styling
 *
 * Displays color-coded legend showing:
 * - Forward FK (many-to-one): Blue, solid
 * - Reverse (one-to-many): Green, dashed
 * - Non-FK (GraphQL only): Gray, dotted
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

export const EdgeLegend: React.FC = () => {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        Edge Types
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Forward FK */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <svg width="50" height="20">
            <line
              x1="0"
              y1="10"
              x2="40"
              y2="10"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <path d="M40,6 L50,10 L40,14 z" fill="#2563eb" />
          </svg>
          <Typography variant="caption" sx={{ flex: 1 }}>
            Forward FK (many-to-one)
          </Typography>
        </Box>

        {/* Reverse FK */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <svg width="50" height="20">
            <line
              x1="0"
              y1="10"
              x2="40"
              y2="10"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <path d="M40,6 L50,10 L40,14 z" fill="#10b981" />
          </svg>
          <Typography variant="caption" sx={{ flex: 1 }}>
            Reverse (one-to-many)
          </Typography>
        </Box>

        {/* Non-FK */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <svg width="50" height="20">
            <line
              x1="0"
              y1="10"
              x2="40"
              y2="10"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <path d="M40,6 L50,10 L40,14 z" fill="#94a3b8" />
          </svg>
          <Typography variant="caption" sx={{ flex: 1 }}>
            GraphQL field (non-FK)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
