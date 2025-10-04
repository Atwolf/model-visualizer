import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { GraphNode, GraphEdge } from '../../lib/graph/types';
import { filterByDepth } from '../../lib/graph/depthFilter';
import { calculateTreeLayout } from '../../lib/graph/treeLayout';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxDepth: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  maxDepth
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
    <div style={{ width: '100%', height: '600px' }}>
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
      </ReactFlow>
    </div>
  );
};
