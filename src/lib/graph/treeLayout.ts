import { GraphNode } from './types';

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 180,
  nodeHeight: 60,
  horizontalSpacing: 50,
  verticalSpacing: 100,
};

/**
 * Calculates tree layout positions for nodes
 * Uses a simple hierarchical algorithm: roots at top, children distributed below
 * @param nodes - Nodes to layout
 * @param config - Layout configuration
 * @returns Nodes with calculated x,y positions
 */
export function calculateTreeLayout(
  nodes: GraphNode[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): GraphNode[] {
  // Group nodes by depth level
  const nodesByDepth = groupNodesByDepth(nodes);

  // Calculate positions
  const positionedNodes = nodes.map(node => {
    const position = calculateNodePosition(
      node,
      nodesByDepth,
      config
    );

    return {
      ...node,
      position,
    };
  });

  return positionedNodes;
}

/**
 * Groups nodes by their depth level
 */
function groupNodesByDepth(nodes: GraphNode[]): Record<number, GraphNode[]> {
  return nodes.reduce((acc, node) => {
    const depth = node.data.depth;
    if (!acc[depth]) {
      acc[depth] = [];
    }
    acc[depth].push(node);
    return acc;
  }, {} as Record<number, GraphNode[]>);
}

/**
 * Calculates position for a single node
 */
function calculateNodePosition(
  node: GraphNode,
  nodesByDepth: Record<number, GraphNode[]>,
  config: LayoutConfig
): { x: number; y: number } {
  const depth = node.data.depth;
  const nodesAtDepth = nodesByDepth[depth] || [];
  const indexAtDepth = nodesAtDepth.findIndex(n => n.id === node.id);

  // Y position based on depth
  const y = depth * (config.nodeHeight + config.verticalSpacing);

  // X position: distribute nodes evenly across width
  const totalWidth = nodesAtDepth.length * config.nodeWidth +
                     (nodesAtDepth.length - 1) * config.horizontalSpacing;
  const startX = -totalWidth / 2; // Center the layout
  const x = startX + indexAtDepth * (config.nodeWidth + config.horizontalSpacing);

  return { x, y };
}
