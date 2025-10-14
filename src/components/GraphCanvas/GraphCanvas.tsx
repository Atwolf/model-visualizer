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
import { GraphNode, GraphEdge } from '../../lib/graph/types';
import { filterByDepth } from '../../lib/graph/depthFilter';
import { calculateTreeLayout } from '../../lib/graph/treeLayout';
import { GraphControlsPanel } from '../GraphControlsPanel/GraphControlsPanel';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxDepth: number;
  // Control panel props
  depth: number;
  onDepthChange: (depth: number) => void;
  // Root type selection - primary model type that can be selected as graph starting point
  rootTypes: string[];
  selectedRootType: string | null;
  onRootTypeSelect: (type: string | null) => void;
  // Type filtering - additional types to include during graph traversal
  filterTypes: string[];
  discoveredTypes: string[];
  onAddFilterType: (typename: string) => void;
  onRemoveFilterType: (typename: string) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  maxDepth,
  depth,
  onDepthChange,
  rootTypes,
  selectedRootType,
  onRootTypeSelect,
  filterTypes,
  discoveredTypes,
  onAddFilterType,
  onRemoveFilterType,
}) => {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Filter and layout nodes based on depth
  useEffect(() => {
    const { filteredNodes, filteredEdges } = filterByDepth(nodes, edges, maxDepth);
    const layoutedNodes = calculateTreeLayout(filteredNodes);

    setFlowNodes(layoutedNodes);
    setFlowEdges(filteredEdges);
  }, [nodes, edges, maxDepth, setFlowNodes, setFlowEdges]);

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />

        {/* Combined controls panel */}
        <Panel position="top-left" style={{ margin: 10 }}>
          <GraphControlsPanel
            rootTypes={rootTypes}
            selectedRootType={selectedRootType}
            onRootTypeSelect={onRootTypeSelect}
            depth={depth}
            onDepthChange={onDepthChange}
            filterTypes={filterTypes}
            discoveredTypes={discoveredTypes}
            onAddFilterType={onAddFilterType}
            onRemoveFilterType={onRemoveFilterType}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
};
