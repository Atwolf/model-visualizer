import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Fab, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { CustomNode } from './CustomNode';
import { FKAwareEdge } from './FKAwareEdge';
import { GraphNode, GraphEdge } from '../../lib/graph/types';
import { filterByDepth } from '../../lib/graph/depthFilter';
import { calculateTreeLayout } from '../../lib/graph/treeLayout';
import { GraphControlsPanel } from '../GraphControlsPanel/GraphControlsPanel';
import { TypeInfo } from '../../lib/graph/typeUtils';
import { filterFKEdges } from '../../lib/graph/edgeEnhancer';
import { GraphDrawer } from '../GraphDrawer/GraphDrawer';

/**
 * Remove nodes that have no edges connecting to them
 *
 * When filtering edges (e.g., FK-only mode), some nodes may become orphaned.
 * This function removes nodes that aren't connected by any of the provided edges.
 *
 * @param nodes - All nodes
 * @param edges - Filtered edges
 * @returns Nodes that are connected by at least one edge
 */
function removeOrphanedNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  // Build set of node IDs that are connected by edges
  const connectedNodeIds = new Set<string>();

  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  // Keep root nodes (depth 0) even if they have no edges
  // This ensures the graph always has starting points
  return nodes.filter(
    (node) => node.data.isRoot || connectedNodeIds.has(node.id)
  );
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxDepth: number;
  // Control panel props
  depth: number;
  onDepthChange: (depth: number) => void;
  // Root type selection - types that can be selected as graph starting points
  rootTypeInfos: TypeInfo[];
  selectedRootTypes: string[];
  onRootTypeSelect: (types: string[]) => void;
  // Type filtering - additional types to include during graph traversal
  filterTypes: string[];
  discoveredTypeInfos: TypeInfo[];
  onAddFilterType: (typename: string) => void;
  onRemoveFilterType: (typename: string) => void;
  // FK filtering - show only FK edges
  showFKOnly: boolean;
  onToggleFKOnly: (enabled: boolean) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  maxDepth,
  depth,
  onDepthChange,
  rootTypeInfos,
  selectedRootTypes,
  onRootTypeSelect,
  filterTypes,
  discoveredTypeInfos,
  onAddFilterType,
  onRemoveFilterType,
  showFKOnly,
  onToggleFKOnly,
}) => {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Define custom edge types
  const edgeTypes = useMemo(() => ({ fkAware: FKAwareEdge }), []);

  // Filter and layout nodes based on depth
  useEffect(() => {
    const { filteredNodes, filteredEdges } = filterByDepth(nodes, edges, maxDepth);

    // Apply FK filtering if enabled
    const finalEdges = showFKOnly ? filterFKEdges(filteredEdges) : filteredEdges;

    // Remove orphaned nodes when FK filtering is enabled
    const finalNodes = showFKOnly
      ? removeOrphanedNodes(filteredNodes, finalEdges)
      : filteredNodes;

    const layoutedNodes = calculateTreeLayout(finalNodes);

    // Convert all edges to use FK-aware edge type
    const typedEdges = finalEdges.map((edge) => ({
      ...edge,
      type: 'fkAware',
    }));

    setFlowNodes(layoutedNodes);
    setFlowEdges(typedEdges);
  }, [nodes, edges, maxDepth, showFKOnly, setFlowNodes, setFlowEdges]);

  return (
    <>
      <GraphDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        edges={flowEdges}
        controlsPanel={
          <GraphControlsPanel
            rootTypeInfos={rootTypeInfos}
            selectedRootTypes={selectedRootTypes}
            onRootTypeSelect={onRootTypeSelect}
            depth={depth}
            onDepthChange={onDepthChange}
            filterTypes={filterTypes}
            discoveredTypeInfos={discoveredTypeInfos}
            onAddFilterType={onAddFilterType}
            onRemoveFilterType={onRemoveFilterType}
            showFKOnly={showFKOnly}
            onToggleFKOnly={onToggleFKOnly}
          />
        }
      />

      {/* Drawer toggle button */}
      <Tooltip title={drawerOpen ? 'Close Controls' : 'Open Controls'} placement="right">
        <Fab
          color="primary"
          aria-label={drawerOpen ? 'close drawer' : 'open drawer'}
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            transition: 'all 0.3s ease',
            transform: drawerOpen ? 'translateX(400px)' : 'translateX(0)',
            '&:hover': {
              transform: drawerOpen ? 'translateX(400px) scale(1.1)' : 'scale(1.1)',
            },
          }}
        >
          {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </Fab>
      </Tooltip>

      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          {/* SVG marker definitions for FK-aware arrows */}
          <svg>
            <defs>
              {/* Blue arrow for forward FKs */}
              <marker
                id="arrow-blue"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
              </marker>

              {/* Green arrow for reverse relationships */}
              <marker
                id="arrow-green"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
              </marker>

              {/* Gray arrow for non-FK edges */}
              <marker
                id="arrow-gray"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>

          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </>
  );
};
