import {
  IntrospectionType,
  IntrospectionField,
  isScalarType,
  unwrapType,
} from '../graphql/introspection';
import { GraphNode, GraphEdge } from './types';
import { applyTreeLayout } from './layout';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TransformOptions {
  maxDepth: number;
  includeScalars?: boolean; // Default: false (filter out scalar fields)
  typeFilter?: (typename: string) => boolean;
  showFieldNodes?: boolean;
  primaryModelChecker?: (typename: string) => boolean;
}

export interface GraphTransformResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    nodesPerDepth: Record<number, number>;
    filteredNodes: number;
    typesFetched: number;
    edgesSkippedNonPrimary: number;
  };
}

// Type for the fetch function
export type TypeFetcher = (typenames: string[]) => Promise<Map<string, IntrospectionType>>;

// Constants
const MAX_TYPES_PER_DEPTH = 100;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Cleans typename for display by removing "Type" suffix
 * Examples:
 *   DeviceType -> Device
 *   InterfaceType -> Interface
 *   DeviceTypeType -> DeviceType (edge case)
 *   Query -> Query (no change)
 *
 * @param typename - Original GraphQL type name
 * @returns Cleaned display name
 */
function cleanTypenameForDisplay(typename: string): string {
  if (typename.endsWith('Type')) {
    return typename.slice(0, -4);
  }
  return typename;
}

/**
 * Generates unique node ID from typename, field, and depth
 * Format: typename:fieldName:depth or typename:root:0
 *
 * @param typename - GraphQL type name
 * @param fieldName - Field name (null for roots)
 * @param depth - Current depth
 * @returns Unique node identifier
 */
function generateNodeId(
  typename: string,
  fieldName: string | null,
  depth: number
): string {
  const fieldPart = fieldName || 'root';
  return `${typename}:${fieldPart}:${depth}`;
}

/**
 * Creates a graph node from type and field information
 *
 * @param typename - GraphQL type name
 * @param fieldName - Field name (null for root nodes)
 * @param depth - Depth in graph
 * @param isRoot - Whether this is a root node
 * @param primaryModelChecker - Optional function to check if type is a primary model
 * @returns GraphNode ready for ReactFlow
 */
function createNode(
  typename: string,
  fieldName: string | null,
  depth: number,
  isRoot: boolean,
  primaryModelChecker?: (typename: string) => boolean
): GraphNode {
  const id = generateNodeId(typename, fieldName, depth);
  // Clean the typename for display by removing "Type" suffix
  const cleanedTypename = cleanTypenameForDisplay(typename);
  const label = isRoot ? cleanedTypename : (fieldName || cleanedTypename);

  // Check if this type corresponds to a primary Nautobot model
  const isPrimaryModel = primaryModelChecker ? primaryModelChecker(typename) : false;

  return {
    id,
    type: 'custom',
    data: {
      label,
      typename, // Keep original typename for system logic
      depth,
      isRoot,
      fieldType: 'object', // Can be enhanced later to distinguish scalar/list
      isPrimaryModel,
    },
    position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
  };
}

/**
 * Creates an edge between parent and child nodes
 *
 * @param parentId - Source node ID
 * @param childId - Target node ID
 * @param fieldName - Field name for edge label (stored but not displayed by default)
 * @returns GraphEdge ready for ReactFlow
 */
function createEdge(
  parentId: string,
  childId: string,
  fieldName: string
): GraphEdge {
  return {
    id: `${parentId}-[${fieldName}]-to-${childId}`,
    source: parentId,
    target: childId,
    // label: fieldName, // Hidden by default - uncomment to show edge labels
    type: 'default', // Straight edges for tree layout
  };
}

/**
 * Extracts relationship fields from introspection type
 * Filters out scalars and introspection fields
 *
 * @param type - Introspection type
 * @returns Array of relationship fields
 */
function extractRelationshipFields(type: IntrospectionType): IntrospectionField[] {
  if (!type.fields) {
    return [];
  }

  return type.fields.filter((field) => {
    // Filter out introspection fields
    if (field.name.startsWith('__')) {
      return false;
    }

    // Unwrap the field type to get the actual type name
    const unwrapped = unwrapType(field.type);

    // Filter out scalar types
    if (isScalarType(unwrapped.name)) {
      return false;
    }

    // Only include OBJECT and INTERFACE types
    return unwrapped.kind === 'OBJECT' || unwrapped.kind === 'INTERFACE';
  });
}

// ============================================================================
// Core Transformation Functions
// ============================================================================

/**
 * Pass 1: Create a node for a single type
 * NO recursion - only creates node for current type
 *
 * @param typename - Type to create node for
 * @param currentDepth - Depth level of this node
 * @param typeData - Available type introspection data
 * @param options - Transform options
 * @param visited - Set of visited type:depth combinations
 * @param nodes - Array to accumulate nodes
 * @param stats - Statistics accumulator
 */
function createNodeForType(
  typename: string,
  currentDepth: number,
  typeData: Map<string, IntrospectionType>,
  options: TransformOptions,
  visited: Set<string>,
  nodes: GraphNode[],
  stats: { filteredNodes: number; nodesPerDepth: Record<number, number> }
): void {
  // Check depth limit
  if (currentDepth >= options.maxDepth) {
    return;
  }

  // Check if we've already visited this type at this depth
  const visitKey = `${typename}:${currentDepth}`;
  if (visited.has(visitKey)) {
    return;
  }
  visited.add(visitKey);

  // Check if type data is available
  const typeInfo = typeData.get(typename);
  if (!typeInfo) {
    console.warn('Referenced type not available:', {
      typename,
      depth: currentDepth,
    });
    return;
  }

  // Create node for this type
  const isRoot = currentDepth === 0;
  const node = createNode(typename, null, currentDepth, isRoot, options.primaryModelChecker);
  nodes.push(node);

  // Update stats
  stats.nodesPerDepth[currentDepth] = (stats.nodesPerDepth[currentDepth] || 0) + 1;

  // Track filtered scalar fields
  const relationshipFields = extractRelationshipFields(typeInfo);
  const totalFields = typeInfo.fields?.length || 0;
  const filteredCount = totalFields - relationshipFields.length;
  stats.filteredNodes += filteredCount;
}

/**
 * Pass 2: Create all edges between existing nodes
 * Iterates through nodes and creates edges based on relationships
 *
 * @param nodes - All created nodes from Pass 1
 * @param typeData - Type introspection data
 * @param options - Transform options including type filter
 * @returns Object with edges array and count of skipped edges
 */
function createEdgesBetweenNodes(
  nodes: GraphNode[],
  typeData: Map<string, IntrospectionType>,
  options: TransformOptions
): { edges: GraphEdge[]; edgesSkippedNonPrimary: number } {
  const edges: GraphEdge[] = [];
  let edgesSkippedNonPrimary = 0;

  // Build node map for O(1) lookups: typename:depth -> node
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    const key = `${node.data.typename}:${node.data.depth}`;
    nodeMap.set(key, node);
  }

  // For each node, create edges to its children
  for (const parentNode of nodes) {
    // Skip edge creation if parent is NOT a primary model
    // This makes non-primary models terminal nodes (leaves)
    if (!parentNode.data.isPrimaryModel) {
      const typeInfo = typeData.get(parentNode.data.typename);
      if (typeInfo) {
        const relationshipFields = extractRelationshipFields(typeInfo);
        if (relationshipFields.length > 0) {
          console.log('[Edge Filtering] Skipping edges from non-primary model:', {
            typename: parentNode.data.typename,
            depth: parentNode.data.depth,
            potentialEdges: relationshipFields.length,
            fields: relationshipFields.map(f => f.name),
          });
          edgesSkippedNonPrimary += relationshipFields.length;
        }
      }
      continue; // Skip this node entirely
    }

    const typeInfo = typeData.get(parentNode.data.typename);
    if (!typeInfo) continue;

    // Get relationship fields for this type
    const relationshipFields = extractRelationshipFields(typeInfo);

    // Create edge for each relationship field
    for (const field of relationshipFields) {
      const unwrapped = unwrapType(field.type);
      const childTypename = unwrapped.name;

      // Apply custom type filter if provided
      if (options.typeFilter && !options.typeFilter(childTypename)) {
        continue;
      }

      // Look for child node at depth + 1
      const childDepth = parentNode.data.depth + 1;
      const childKey = `${childTypename}:${childDepth}`;
      const childNode = nodeMap.get(childKey);

      // Only create edge if child node exists
      if (childNode) {
        const edge = createEdge(parentNode.id, childNode.id, field.name);
        edges.push(edge);
      }
    }
  }

  return { edges, edgesSkippedNonPrimary };
}

/**
 * Collects referenced types from relationship fields
 */
function getReferencedTypes(
  typeData: Map<string, IntrospectionType>,
  typenames: string[],
  options: TransformOptions
): string[] {
  const referenced = new Set<string>();

  for (const typename of typenames) {
    const typeInfo = typeData.get(typename);
    if (!typeInfo) continue;

    const fields = extractRelationshipFields(typeInfo);
    for (const field of fields) {
      const unwrapped = unwrapType(field.type);

      // Apply custom filter if provided
      if (options.typeFilter && !options.typeFilter(unwrapped.name)) {
        continue;
      }

      referenced.add(unwrapped.name);
    }
  }

  return Array.from(referenced);
}


/**
 * Transforms GraphQL introspection data into graph nodes and edges
 * Uses two-pass approach: Pass 1 creates all nodes, Pass 2 creates all edges
 *
 * @param rootTypes - Array of root type names selected by user
 * @param typeData - Map of typename to introspection data
 * @param options - Transform options including depth and filters
 * @param fetchTypes - Function to fetch missing types
 * @returns Graph nodes, edges, and statistics
 */
export async function buildGraphFromIntrospection(
  rootTypes: string[],
  typeData: Map<string, IntrospectionType>,
  options: TransformOptions,
  fetchTypes?: TypeFetcher
): Promise<GraphTransformResult> {
  console.log('Transforming introspection data:', {
    roots: rootTypes,
    maxDepth: options.maxDepth,
    availableTypes: typeData.size,
    autoFetch: !!fetchTypes,
  });

  const allTypeData = new Map(typeData);
  const nodes: GraphNode[] = [];
  const visited = new Set<string>();
  const stats = {
    filteredNodes: 0,
    nodesPerDepth: {} as Record<number, number>,
    typesFetched: 0,
  };

  // ============================================================================
  // PASS 1: Create all nodes breadth-first (no edges, no recursion)
  // ============================================================================

  let currentTypes = rootTypes;

  for (let depth = 0; depth < options.maxDepth; depth++) {
    // Filter out already visited types at this depth
    const typesToProcess = currentTypes.filter(t => !visited.has(`${t}:${depth}`));

    if (typesToProcess.length === 0) break;

    // Find missing types
    const missingTypes = typesToProcess.filter(t => !allTypeData.has(t));

    // Auto-fetch missing types if fetcher is provided
    if (missingTypes.length > 0 && fetchTypes) {
      let typesToFetch = missingTypes;

      // Limit types per depth
      if (typesToFetch.length > MAX_TYPES_PER_DEPTH) {
        console.warn(`Too many types at depth ${depth}: ${typesToFetch.length}, limiting to ${MAX_TYPES_PER_DEPTH}`);
        typesToFetch = typesToFetch.slice(0, MAX_TYPES_PER_DEPTH);
      }

      console.log(`Auto-fetching types at depth ${depth}:`, {
        typesToFetch,
        count: typesToFetch.length,
      });

      const startTime = Date.now();
      const fetchedTypes = await fetchTypes(typesToFetch);
      const duration = Date.now() - startTime;

      console.log('Types fetched:', {
        requested: typesToFetch.length,
        successful: fetchedTypes.size,
        duration: `${duration}ms`,
      });

      // Add fetched types to our working set
      fetchedTypes.forEach((type, name) => {
        allTypeData.set(name, type);
      });

      stats.typesFetched += fetchedTypes.size;
    }

    // Create nodes for types at current depth (no recursion)
    for (const typename of typesToProcess) {
      createNodeForType(
        typename,
        depth,
        allTypeData,
        options,
        visited,
        nodes,
        stats
      );
    }

    // Get referenced types for next depth
    currentTypes = getReferencedTypes(allTypeData, typesToProcess, options);
  }

  // ============================================================================
  // PASS 2: Create all edges between existing nodes
  // ============================================================================

  const { edges, edgesSkippedNonPrimary } = createEdgesBetweenNodes(nodes, allTypeData, options);

  // ============================================================================
  // PASS 3: Apply tree layout to position nodes
  // ============================================================================

  applyTreeLayout(nodes);

  const result: GraphTransformResult = {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesPerDepth: stats.nodesPerDepth,
      filteredNodes: stats.filteredNodes,
      typesFetched: stats.typesFetched,
      edgesSkippedNonPrimary,
    },
  };

  console.log('Graph transformation complete:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    nodesPerDepth: result.stats.nodesPerDepth,
    filtered: result.stats.filteredNodes,
    typesFetched: stats.typesFetched,
    edgesSkippedNonPrimary,
  });

  return result;
}
