import { GraphNode, GraphEdge } from './types';

interface FilterResult {
  filteredNodes: GraphNode[];
  filteredEdges: GraphEdge[];
}

/**
 * Filters nodes and edges based on maximum depth
 * @param nodes - All available nodes
 * @param edges - All available edges
 * @param maxDepth - Maximum depth to display (1 = roots only, 2 = roots + children, etc.)
 * @returns Filtered nodes and edges within depth limit
 */
export function filterByDepth(
  nodes: GraphNode[],
  edges: GraphEdge[],
  maxDepth: number
): FilterResult {
  // Filter nodes by depth
  const filteredNodes = nodes.filter(node => node.data.depth < maxDepth);

  // Filter edges - only include if both source and target are in filtered nodes
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(
    edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return { filteredNodes, filteredEdges };
}
