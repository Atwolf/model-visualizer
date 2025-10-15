import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { FKAwareEdge } from './FKAwareEdge';
import { EdgeLegend } from '../EdgeLegend/EdgeLegend';
import { FKStats } from '../FKStats/FKStats';
import { GraphNode, GraphEdge } from '../../lib/graph/types';
import { filterByDepth } from '../../lib/graph/depthFilter';
import { calculateTreeLayout } from '../../lib/graph/treeLayout';
import { GraphControlsPanel } from '../GraphControlsPanel/GraphControlsPanel';
import { TypeInfo } from '../../lib/graph/typeUtils';
import { filterFKEdges } from '../../lib/graph/edgeEnhancer';

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

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Define custom edge types
  const edgeTypes = useMemo(() => ({ fkAware: FKAwareEdge }), []);

  // Filter and layout nodes based on depth
  useEffect(() => {
    const { filteredNodes, filteredEdges } = filterByDepth(nodes, edges, maxDepth);

    // Apply FK filtering if enabled
    const finalEdges = showFKOnly ? filterFKEdges(filteredEdges) : filteredEdges;

    const layoutedNodes = calculateTreeLayout(filteredNodes);

    // Convert all edges to use FK-aware edge type
    const typedEdges = finalEdges.map((edge) => ({
      ...edge,
      type: 'fkAware',
    }));

    setFlowNodes(layoutedNodes);
    setFlowEdges(typedEdges);
  }, [nodes, edges, maxDepth, showFKOnly, setFlowNodes, setFlowEdges]);

  return (
    <div style={{ width: '100%', height: '800px' }}>
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

        {/* Combined controls panel */}
        <Panel position="top-left" style={{ margin: 10 }}>
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
        </Panel>

        {/* Edge Legend */}
        <Panel position="bottom-left" style={{ margin: 10 }}>
          <EdgeLegend />
        </Panel>

        {/* FK Statistics */}
        <Panel position="bottom-right" style={{ margin: 10 }}>
          <FKStats edges={flowEdges} />
        </Panel>
      </ReactFlow>
    </div>
  );
};
