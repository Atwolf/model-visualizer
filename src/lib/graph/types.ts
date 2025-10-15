import { Node, Edge } from 'reactflow';
import { FKMetadata } from '../../types/fkMetadata';

export interface GraphNode extends Node {
  data: {
    label: string;
    typename: string;
    depth: number;
    isRoot: boolean;
    fieldType?: 'scalar' | 'object' | 'list';
  };
}

/**
 * FK metadata that can be attached to edge data
 */
export interface FKEdgeData {
  /** Whether this edge represents a foreign key relationship */
  isFK?: boolean;

  /** FK direction (forward = many-to-one, reverse = one-to-many) */
  direction?: 'forward' | 'reverse';

  /** FK cardinality */
  cardinality?: 'many-to-one' | 'one-to-many' | 'many-to-many';

  /** Source PostgreSQL table name */
  sourceTable?: string;

  /** Target PostgreSQL table name */
  targetTable?: string;

  /** Whether this is a junction table (many-to-many) */
  isJunctionTable?: boolean;

  /** Complete FK metadata (for detailed inspection) */
  fkMetadata?: FKMetadata;
}

/**
 * Enhanced edge type with FK metadata support
 *
 * Uses ReactFlow's Edge type with FK data.
 */
export type GraphEdge = Edge<FKEdgeData>;
