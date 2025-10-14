import { GraphNode } from './types';

/**
 * Layout configuration for tree positioning
 */
export interface LayoutConfig {
  /** Horizontal spacing between sibling nodes in pixels */
  horizontalSpacing: number;
  /** Vertical spacing between depth levels in pixels */
  verticalSpacing: number;
}

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  horizontalSpacing: 200,
  verticalSpacing: 150,
};

/**
 * Groups nodes by their depth level
 *
 * @param nodes - All graph nodes
 * @returns Map of depth -> nodes at that depth
 */
function groupNodesByDepth(nodes: GraphNode[]): Map<number, GraphNode[]> {
  const depthMap = new Map<number, GraphNode[]>();

  for (const node of nodes) {
    const depth = node.data.depth;
    const nodesAtDepth = depthMap.get(depth) || [];
    nodesAtDepth.push(node);
    depthMap.set(depth, nodesAtDepth);
  }

  return depthMap;
}

/**
 * Applies hierarchical tree layout to graph nodes
 * Positions nodes in a top-down tree structure with even spacing
 *
 * Algorithm:
 * 1. Group nodes by depth level
 * 2. For each level:
 *    - Calculate y position (depth * verticalSpacing)
 *    - Calculate total width needed for all nodes at this level
 *    - Center the level horizontally
 *    - Space nodes evenly across the width
 *
 * @param nodes - Graph nodes to position (will be modified in place)
 * @param config - Optional layout configuration
 * @returns The same nodes array with updated positions
 */
export function applyTreeLayout(
  nodes: GraphNode[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): GraphNode[] {
  console.log('[Layout] Applying tree layout:', {
    nodeCount: nodes.length,
    config,
  });

  if (nodes.length === 0) {
    return nodes;
  }

  // Group nodes by depth
  const depthMap = groupNodesByDepth(nodes);
  const maxDepth = Math.max(...Array.from(depthMap.keys()));

  console.log('[Layout] Depth distribution:', {
    maxDepth,
    nodesPerDepth: Array.from(depthMap.entries()).map(([depth, nodes]) => ({
      depth,
      count: nodes.length,
    })),
  });

  // Position nodes level by level
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtDepth = depthMap.get(depth) || [];
    if (nodesAtDepth.length === 0) continue;

    // Calculate y position for this level
    const y = depth * config.verticalSpacing;

    // Calculate total width needed for this level
    const totalWidth = (nodesAtDepth.length - 1) * config.horizontalSpacing;

    // Calculate starting x position to center the level
    const startX = -totalWidth / 2;

    // Position each node at this depth
    for (let i = 0; i < nodesAtDepth.length; i++) {
      const node = nodesAtDepth[i];
      node.position = {
        x: startX + (i * config.horizontalSpacing),
        y: y,
      };
    }

    console.log(`[Layout] Positioned ${nodesAtDepth.length} nodes at depth ${depth}:`, {
      y,
      xRange: [startX, startX + totalWidth],
    });
  }

  console.log('[Layout] Tree layout complete');

  return nodes;
}
