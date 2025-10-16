/**
 * Edge Enhancer - Enriches graph edges with FK metadata
 *
 * This module integrates FK metadata into the graph building process,
 * adding directionality and cardinality information to edges during
 * the second pass of the three-pass algorithm.
 */

import { FKLookupMap, FKMetadata } from '../../types/fkMetadata';
import { GraphEdge } from './types';

/**
 * Enhance an edge with FK metadata if available
 *
 * This is called during Pass 2 of graph building (edge creation).
 * It looks up FK metadata and enriches the edge data structure.
 *
 * @param edge - Base edge created by graph transformer
 * @param sourceType - GraphQL type name of source node
 * @param fieldName - Field name that creates this edge
 * @param fkLookup - FK lookup map (nullable for graceful degradation)
 * @returns Enhanced edge with FK metadata in data property
 *
 * @example
 * ```typescript
 * // During edge creation in graphqlTransformer.ts:
 * const baseEdge = createEdge(parentId, childId, field.name);
 *
 * const enhancedEdge = enhanceEdgeWithFK(
 *   baseEdge,
 *   'DeviceType',
 *   'manufacturer',
 *   fkLookup
 * );
 *
 * // enhancedEdge now has:
 * // data: {
 * //   isFK: true,
 * //   direction: 'forward',
 * //   cardinality: 'many-to-one',
 * //   fkMetadata: { ... }
 * // }
 * ```
 */
export function enhanceEdgeWithFK(
  edge: GraphEdge,
  sourceType: string,
  fieldName: string,
  fkLookup: FKLookupMap | null
): GraphEdge {
  // If no FK lookup available, mark edge as non-FK
  if (!fkLookup) {
    return {
      ...edge,
      data: {
        ...(edge.data || {}),
        isFK: false,
      },
    };
  }

  // Build lookup key
  const lookupKey = `${sourceType}.${fieldName}`;
  const fkMetadata = fkLookup.get(lookupKey);

  // Debug logging for specific test relationships
  const isTestRelationship =
    (sourceType === 'DeviceType' && fieldName === 'location') ||
    (sourceType === 'LocationType' && fieldName === 'devices') ||
    (sourceType === 'DeviceType' && fieldName === 'interfaces') ||
    (sourceType === 'InterfaceType' && fieldName === 'device');

  if (isTestRelationship) {
    console.log('[FK Lookup Debug]', {
      sourceType,
      fieldName,
      lookupKey,
      found: !!fkMetadata,
      metadata: fkMetadata
        ? {
            direction: fkMetadata.direction,
            cardinality: fkMetadata.cardinality,
            sourceTable: fkMetadata.sourceTable,
            targetTable: fkMetadata.targetTable,
            sourceColumn: fkMetadata.sourceColumn,
            targetColumn: fkMetadata.targetColumn,
          }
        : null,
    });
  }

  // If FK metadata found, enhance edge
  if (fkMetadata) {
    return {
      ...edge,
      data: {
        ...(edge.data || {}),
        isFK: true,
        fkMetadata,
        direction: fkMetadata.direction,
        cardinality: fkMetadata.cardinality,
        sourceTable: fkMetadata.sourceTable,
        targetTable: fkMetadata.targetTable,
        isJunctionTable: fkMetadata.isJunctionTable,
      },
    };
  }

  // No FK metadata found - this is a GraphQL-only field
  return {
    ...edge,
    data: {
      ...(edge.data || {}),
      isFK: false,
    },
  };
}

/**
 * Check if an edge represents a FK relationship
 *
 * Quick boolean check for filtering and conditional logic.
 *
 * @param edge - Graph edge to check
 * @returns True if edge has FK metadata
 *
 * @example
 * ```typescript
 * const edges = graph.edges.filter(isFKEdge);
 * console.log(`Found ${edges.length} FK edges`);
 * ```
 */
export function isFKEdge(edge: GraphEdge): boolean {
  return edge.data?.isFK === true;
}

/**
 * Get FK direction from edge
 *
 * Returns the direction if this is a FK edge, null otherwise.
 *
 * @param edge - Graph edge
 * @returns FK direction or null
 *
 * @example
 * ```typescript
 * const direction = getEdgeDirection(edge);
 * if (direction === 'forward') {
 *   console.log('This is a forward FK (many-to-one)');
 * }
 * ```
 */
export function getEdgeDirection(edge: GraphEdge): 'forward' | 'reverse' | null {
  return edge.data?.direction ?? null;
}

/**
 * Get FK cardinality from edge
 *
 * Returns the cardinality if this is a FK edge, null otherwise.
 *
 * @param edge - Graph edge
 * @returns FK cardinality or null
 *
 * @example
 * ```typescript
 * const cardinality = getEdgeCardinality(edge);
 * if (cardinality === 'many-to-one') {
 *   console.log('Multiple sources can reference one target');
 * }
 * ```
 */
export function getEdgeCardinality(
  edge: GraphEdge
): 'many-to-one' | 'one-to-many' | 'many-to-many' | null {
  return edge.data?.cardinality ?? null;
}

/**
 * Get full FK metadata from edge
 *
 * Returns the complete FKMetadata object if available.
 *
 * @param edge - Graph edge
 * @returns FK metadata or null
 *
 * @example
 * ```typescript
 * const metadata = getFKMetadataFromEdge(edge);
 * if (metadata) {
 *   console.log(`Source table: ${metadata.sourceTable}`);
 *   console.log(`Target table: ${metadata.targetTable}`);
 *   console.log(`Field name: ${metadata.fieldName}`);
 * }
 * ```
 */
export function getFKMetadataFromEdge(edge: GraphEdge): FKMetadata | null {
  return edge.data?.fkMetadata ?? null;
}

/**
 * Filter edges to only FK relationships
 *
 * Utility function for extracting FK edges from a graph.
 *
 * @param edges - Array of graph edges
 * @returns Array containing only FK edges
 *
 * @example
 * ```typescript
 * const allEdges = graph.edges;
 * const fkEdges = filterFKEdges(allEdges);
 * console.log(`${fkEdges.length} out of ${allEdges.length} edges are FKs`);
 * ```
 */
export function filterFKEdges(edges: GraphEdge[]): GraphEdge[] {
  return edges.filter(isFKEdge);
}

/**
 * Filter edges by FK direction
 *
 * Returns only edges matching the specified direction.
 *
 * @param edges - Array of graph edges
 * @param direction - Direction to filter by
 * @returns Array of edges matching direction
 *
 * @example
 * ```typescript
 * const forwardFKs = filterEdgesByDirection(graph.edges, 'forward');
 * const reverseFKs = filterEdgesByDirection(graph.edges, 'reverse');
 *
 * console.log(`Forward FKs: ${forwardFKs.length}`);
 * console.log(`Reverse relationships: ${reverseFKs.length}`);
 * ```
 */
export function filterEdgesByDirection(
  edges: GraphEdge[],
  direction: 'forward' | 'reverse'
): GraphEdge[] {
  return edges.filter((edge) => getEdgeDirection(edge) === direction);
}

/**
 * Filter edges by cardinality
 *
 * Returns only edges matching the specified cardinality.
 *
 * @param edges - Array of graph edges
 * @param cardinality - Cardinality to filter by
 * @returns Array of edges matching cardinality
 *
 * @example
 * ```typescript
 * const manyToOne = filterEdgesByCardinality(graph.edges, 'many-to-one');
 * const manyToMany = filterEdgesByCardinality(graph.edges, 'many-to-many');
 *
 * console.log(`Many-to-one relationships: ${manyToOne.length}`);
 * console.log(`Many-to-many relationships: ${manyToMany.length}`);
 * ```
 */
export function filterEdgesByCardinality(
  edges: GraphEdge[],
  cardinality: 'many-to-one' | 'one-to-many' | 'many-to-many'
): GraphEdge[] {
  return edges.filter((edge) => getEdgeCardinality(edge) === cardinality);
}

/**
 * Get statistics about FK edges in a graph
 *
 * Analyzes edges and provides summary statistics.
 *
 * @param edges - Array of graph edges
 * @returns Statistics object
 *
 * @example
 * ```typescript
 * const stats = getEdgeStats(graph.edges);
 *
 * console.log(`Total edges: ${stats.total}`);
 * console.log(`FK edges: ${stats.fkEdges} (${stats.fkPercentage}%)`);
 * console.log(`Forward FKs: ${stats.forwardFKs}`);
 * console.log(`Reverse: ${stats.reverseFKs}`);
 * console.log(`Many-to-one: ${stats.manyToOne}`);
 * console.log(`Many-to-many: ${stats.manyToMany}`);
 * ```
 */
export function getEdgeStats(edges: GraphEdge[]): {
  total: number;
  fkEdges: number;
  nonFKEdges: number;
  fkPercentage: number;
  forwardFKs: number;
  reverseFKs: number;
  manyToOne: number;
  oneToMany: number;
  manyToMany: number;
  junctionTables: number;
} {
  const total = edges.length;
  const fkEdges = edges.filter(isFKEdge);
  const fkCount = fkEdges.length;
  const nonFKCount = total - fkCount;
  const fkPercentage = total > 0 ? (fkCount / total) * 100 : 0;

  const forwardFKs = filterEdgesByDirection(edges, 'forward').length;
  const reverseFKs = filterEdgesByDirection(edges, 'reverse').length;

  const manyToOne = filterEdgesByCardinality(edges, 'many-to-one').length;
  const oneToMany = filterEdgesByCardinality(edges, 'one-to-many').length;
  const manyToMany = filterEdgesByCardinality(edges, 'many-to-many').length;

  const junctionTables = edges.filter((edge) => edge.data?.isJunctionTable === true).length;

  return {
    total,
    fkEdges: fkCount,
    nonFKEdges: nonFKCount,
    fkPercentage,
    forwardFKs,
    reverseFKs,
    manyToOne,
    oneToMany,
    manyToMany,
    junctionTables,
  };
}

/**
 * Validate FK enhancement integrity
 *
 * Checks that FK enhancement was applied correctly and all FK edges
 * have required metadata. Useful for debugging and testing.
 *
 * @param edges - Array of graph edges
 * @returns Validation result with any issues found
 *
 * @example
 * ```typescript
 * const validation = validateFKEnhancement(graph.edges);
 *
 * if (!validation.valid) {
 *   console.error('FK enhancement issues:', validation.issues);
 * } else {
 *   console.log('All FK edges properly enhanced');
 * }
 * ```
 */
export function validateFKEnhancement(edges: GraphEdge[]): {
  valid: boolean;
  issues: string[];
  summary: string;
} {
  const issues: string[] = [];

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];

    // Check if edge has isFK property
    if (edge.data && typeof edge.data.isFK !== 'boolean') {
      issues.push(`Edge ${i} (${edge.id}) missing isFK property`);
    }

    // If marked as FK, validate metadata presence
    if (edge.data?.isFK === true) {
      if (!edge.data.direction) {
        issues.push(`FK edge ${i} (${edge.id}) missing direction`);
      }
      if (!edge.data.cardinality) {
        issues.push(`FK edge ${i} (${edge.id}) missing cardinality`);
      }
      if (!edge.data.fkMetadata) {
        issues.push(`FK edge ${i} (${edge.id}) missing fkMetadata`);
      }
    }
  }

  const valid = issues.length === 0;
  const summary = valid
    ? `All ${edges.length} edges properly enhanced`
    : `Found ${issues.length} issues in ${edges.length} edges`;

  return { valid, issues, summary };
}
