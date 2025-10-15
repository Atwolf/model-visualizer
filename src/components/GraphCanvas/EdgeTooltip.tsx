/**
 * EdgeTooltip - Displays detailed FK metadata for graph edges
 *
 * Shows information about foreign key relationships including:
 * - Direction (forward/reverse)
 * - Cardinality (many-to-one, one-to-many, many-to-many)
 * - Source and target PostgreSQL tables
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { FKEdgeData } from '../../lib/graph/types';

interface EdgeTooltipProps {
  data: FKEdgeData;
}

export const EdgeTooltip: React.FC<EdgeTooltipProps> = ({ data }) => {
  if (!data.isFK) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          minWidth: 200,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          GraphQL Field (non-FK)
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        minWidth: 250,
      }}
    >
      {/* Header */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Foreign Key Relationship
      </Typography>

      {/* Direction */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
          Direction:
        </Typography>
        <Chip
          label={data.direction === 'forward' ? '→ Forward' : '← Reverse'}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            bgcolor: data.direction === 'forward' ? '#2563eb' : '#10b981',
            color: 'white',
          }}
        />
      </Box>

      {/* Cardinality */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
          Cardinality:
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {data.cardinality}
        </Typography>
      </Box>

      {/* Source Table */}
      {data.sourceTable && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
            Source Table:
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          >
            {data.sourceTable}
          </Typography>
        </Box>
      )}

      {/* Target Table */}
      {data.targetTable && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
            Target Table:
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          >
            {data.targetTable}
          </Typography>
        </Box>
      )}

      {/* Junction Table Indicator */}
      {data.isJunctionTable && (
        <Box sx={{ mt: 1 }}>
          <Chip
            label="Many-to-Many Junction Table"
            size="small"
            color="info"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
      )}
    </Box>
  );
};
