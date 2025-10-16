/**
 * FKAwareEdge - Custom ReactFlow edge component with FK-aware styling
 *
 * This component visually differentiates edges based on foreign key metadata:
 * - Forward FK (many-to-one): Blue, solid, 2px
 * - Reverse (one-to-many): Green, dashed, 2px
 * - Non-FK (GraphQL only): Gray, dotted, 1px
 */

import React from 'react';
import {
  BaseEdge,
  EdgeProps,
  EdgeLabelRenderer,
  getStraightPath,
} from 'reactflow';
import { FKEdgeData } from '../../lib/graph/types';

export const FKAwareEdge: React.FC<EdgeProps<FKEdgeData>> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, data } = props;

  // Calculate straight path for horizontal tree layout
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Determine styling based on FK metadata
  const style = getEdgeStyle(data);
  const markerEnd = getMarkerEnd(data);

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {data?.isFK && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '3px',
              border: '1px solid #e5e7eb',
            }}
            className="fk-edge-label"
            title={`${data.direction} FK (${data.cardinality})`}
          >
            <span
              style={{
                color: data.direction === 'forward' ? '#2563eb' : '#10b981',
                fontWeight: 600,
              }}
            >
              FK
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

/**
 * Get edge styling based on FK metadata
 *
 * Visual specifications:
 * - Forward FK: Blue (#2563eb), solid, 2px
 * - Reverse: Green (#10b981), dashed (5,5), 2px
 * - Non-FK: Gray (#94a3b8), dotted (3,3), 1px
 */
function getEdgeStyle(data?: FKEdgeData): React.CSSProperties {
  if (!data?.isFK) {
    // GraphQL field (non-FK relationship)
    return {
      stroke: '#94a3b8',
      strokeWidth: 1,
      strokeDasharray: '3,3',
    };
  }

  if (data.direction === 'forward') {
    // Forward FK (many-to-one)
    return {
      stroke: '#2563eb',
      strokeWidth: 2,
      strokeDasharray: 'none',
    };
  }

  // Reverse relationship (one-to-many)
  return {
    stroke: '#10b981',
    strokeWidth: 2,
    strokeDasharray: '5,5',
  };
}

/**
 * Get arrow marker ID based on FK metadata
 *
 * Markers are defined in GraphCanvas.tsx as SVG defs
 */
function getMarkerEnd(data?: FKEdgeData): string {
  if (!data?.isFK) {
    return 'url(#arrow-gray)';
  }

  if (data.direction === 'forward') {
    return 'url(#arrow-blue)';
  }

  return 'url(#arrow-green)';
}
