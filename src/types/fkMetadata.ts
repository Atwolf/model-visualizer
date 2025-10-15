/**
 * Foreign Key Metadata Types
 *
 * This module defines the core types for working with PostgreSQL foreign key
 * relationships and mapping them to GraphQL schema edges.
 */

/**
 * Raw foreign key data from PostgreSQL information_schema
 * This matches the structure of source_target.json
 */
export interface PgForeignKey {
  source_table: string;      // e.g., "dcim_device"
  source_column: string;     // e.g., "manufacturer_id"
  target_table: string;      // e.g., "dcim_manufacturer"
  target_column: string;     // e.g., "id"
}

/**
 * Direction of the foreign key relationship
 * - forward: The field owns the FK (many-to-one)
 * - reverse: The field is referenced by FK (one-to-many)
 */
export type FKDirection = 'forward' | 'reverse';

/**
 * Cardinality of the relationship
 * - many-to-one: Standard FK (source -> target)
 * - one-to-many: Reverse of FK (target <- source)
 * - many-to-many: Junction table relationship
 */
export type FKCardinality = 'many-to-one' | 'one-to-many' | 'many-to-many';

/**
 * Enhanced metadata about a foreign key relationship
 * Includes both database info and inferred semantics
 */
export interface FKMetadata {
  /** Direction of this relationship */
  direction: FKDirection;

  /** Cardinality of this relationship */
  cardinality: FKCardinality;

  /** Source table name (PostgreSQL) */
  sourceTable: string;

  /** Target table name (PostgreSQL) */
  targetTable: string;

  /** Source column name (PostgreSQL) */
  sourceColumn: string;

  /** Target column name (PostgreSQL, usually 'id') */
  targetColumn: string;

  /** Inferred field name (GraphQL style) */
  fieldName: string;

  /** Whether this is a junction table relationship */
  isJunctionTable?: boolean;

  /** Original FK data for debugging */
  original: PgForeignKey;
}

/**
 * Lookup map for fast FK metadata access during graph building
 * Key format: "TypeName.fieldName" (e.g., "DeviceType.manufacturer")
 */
export type FKLookupMap = Map<string, FKMetadata>;

/**
 * Statistics about FK parsing and mapping
 */
export interface FKParseStats {
  totalFKs: number;
  forwardFKs: number;
  reverseFKs: number;
  junctionTables: number;
  selfReferences: number;
  parseErrors: number;
}
