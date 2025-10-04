import { GraphNode, GraphEdge } from './types';

/**
 * Recursively creates child nodes for a given parent
 * Stops when currentDepth + 1 >= maxDepth
 *
 * @param parentId - ID of the parent node
 * @param parentLabel - Label of the parent node
 * @param currentDepth - Current depth level of the parent
 * @param maxDepth - Maximum depth to traverse
 * @param nodes - Array to accumulate nodes
 * @param edges - Array to accumulate edges
 */
function createChildrenRecursive(
  parentId: string,
  parentLabel: string,
  currentDepth: number,
  maxDepth: number,
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  // Stop if we've reached the maximum depth
  const childDepth = currentDepth + 1;
  if (childDepth >= maxDepth) {
    return;
  }

  // Create 2 children for each parent node
  const childCount = 2;

  for (let i = 0; i < childCount; i++) {
    const childId = `${parentId}-child-${i}`;
    const childLabel = `${parentLabel}Field${i + 1}`;

    nodes.push({
      id: childId,
      type: 'custom',
      data: {
        label: childLabel,
        depth: childDepth,
        isRoot: false,
      },
      position: { x: 0, y: 0 }, // Will be calculated by layout
    });

    edges.push({
      id: `${parentId}-to-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
    });

    // Recursively create children for this child
    createChildrenRecursive(
      childId,
      childLabel,
      childDepth,
      maxDepth,
      nodes,
      edges
    );
  }
}

/**
 * Builds a mock hierarchical graph from root type names
 * Creates nodes at each depth level up to maxDepth
 *
 * @param rootTypes - Array of root type names
 * @param maxDepth - Number of levels in the graph (1 = roots only, 2 = roots + children, etc.)
 * @returns Graph with nodes and edges representing the hierarchy
 */
export function buildGraphFromRoots(
  rootTypes: string[],
  maxDepth: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  console.log('Building graph:', { roots: rootTypes, maxDepth });

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create root nodes
  rootTypes.forEach((typeName) => {
    const rootId = `root-${typeName}`;
    nodes.push({
      id: rootId,
      type: 'custom',
      data: {
        label: typeName,
        depth: 0,
        isRoot: true,
      },
      position: { x: 0, y: 0 }, // Will be calculated by layout
    });

    // Recursively create children for this root
    createChildrenRecursive(
      rootId,
      typeName,
      0,
      maxDepth,
      nodes,
      edges
    );
  });

  console.log('Graph built:', { nodes: nodes.length, edges: edges.length });

  return { nodes, edges };
}
