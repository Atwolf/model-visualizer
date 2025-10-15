/**
 * FKStats - Statistics panel for FK edge analysis
 *
 * Displays real-time statistics about graph edges:
 * - Total edges count
 * - FK vs non-FK breakdown
 * - Forward vs reverse FK counts
 * - Coverage percentage
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { GraphEdge } from '../../lib/graph/types';
import { getEdgeStats } from '../../lib/graph/edgeEnhancer';

interface FKStatsProps {
  edges: GraphEdge[];
}

export const FKStats: React.FC<FKStatsProps> = ({ edges }) => {
  // Calculate statistics using edge enhancer utility
  const stats = useMemo(() => getEdgeStats(edges), [edges]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        minWidth: 250,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        FK Statistics
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {/* Total Edges */}
        <StatRow label="Total Edges" value={stats.total} />

        <Divider sx={{ my: 0.5 }} />

        {/* FK Edges with percentage */}
        <StatRow
          label="FK Edges"
          value={`${stats.fkEdges} (${stats.fkPercentage.toFixed(1)}%)`}
          highlight
        />

        {/* Forward FKs */}
        <StatRow
          label="Forward FKs"
          value={stats.forwardFKs}
          color="#2563eb"
          indent
        />

        {/* Reverse */}
        <StatRow
          label="Reverse"
          value={stats.reverseFKs}
          color="#10b981"
          indent
        />

        {/* Many-to-many */}
        {stats.manyToMany > 0 && (
          <StatRow
            label="Many-to-Many"
            value={stats.manyToMany}
            color="#8b5cf6"
            indent
          />
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Non-FK Edges */}
        <StatRow label="Non-FK Edges" value={stats.nonFKEdges} color="#94a3b8" />

        {/* Junction Tables */}
        {stats.junctionTables > 0 && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <StatRow label="Junction Tables" value={stats.junctionTables} />
          </>
        )}
      </Box>
    </Paper>
  );
};

/**
 * StatRow - Reusable row component for displaying statistics
 */
interface StatRowProps {
  label: string;
  value: number | string;
  color?: string;
  highlight?: boolean;
  indent?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  color,
  highlight,
  indent,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pl: indent ? 2 : 0,
      }}
    >
      <Typography
        variant="caption"
        color={color ? 'inherit' : 'text.secondary'}
        sx={{
          fontWeight: highlight ? 600 : 400,
          ...(color && { color }),
        }}
      >
        {label}:
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: highlight ? 600 : 500,
          ...(color && { color }),
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};
