/**
 * Type definitions for PostgreSQL Foreign Key metadata
 *
 * This module provides type-safe interfaces for working with foreign key
 * relationships extracted from PostgreSQL and mapping them to GraphQL types.
 */

/**
 * Raw foreign key data from PostgreSQL information_schema
 *
 * Represents a single foreign key constraint as exported from the database.
 * The source table "owns" the FK (contains the foreign key column),
 * and references the target table.
 *
 * @example
 * ```typescript
 * const fk: PgForeignKey = {
 *   source_table: 'dcim_device',
 *   source_column: 'manufacturer_id',
 *   target_table: 'dcim_manufacturer',
 *   target_column: 'id'
 * };
 * ```
 */
export interface PgForeignKey {
  /** Source table name (e.g., "dcim_device") - contains the FK column */
  source_table: string;
  /** Source column name (e.g., "manufacturer_id") - the FK column */
  source_column: string;
  /** Target table name (e.g., "dcim_manufacturer") - referenced table */
  target_table: string;
  /** Target column name (e.g., "id") - referenced column, usually 'id' */
  target_column: string;
}

/**
 * Direction of the foreign key relationship from a field's perspective
 *
 * - `forward`: The field owns the FK (many-to-one relationship)
 *   Example: Device.manufacturer → ManufacturerType
 *
 * - `reverse`: The field is referenced by FK (one-to-many relationship)
 *   Example: Manufacturer.devices ← DeviceType
 */
export type FKDirection = 'forward' | 'reverse';

/**
 * Cardinality of the relationship
 *
 * - `many-to-one`: Standard FK (source → target)
 *   Multiple devices can reference one manufacturer
 *
 * - `one-to-many`: Reverse of FK (target ← source)
 *   One manufacturer is referenced by many devices
 *
 * - `many-to-many`: Junction table relationship
 *   Devices and software images connected via junction table
 */
export type FKCardinality = 'many-to-one' | 'one-to-many' | 'many-to-many';

/**
 * Enhanced metadata about a foreign key relationship
 *
 * Combines database FK information with inferred GraphQL semantics.
 * This is the primary data structure used throughout the application
 * for understanding relationship directionality and cardinality.
 *
 * @example
 * ```typescript
 * const metadata: FKMetadata = {
 *   direction: 'forward',
 *   cardinality: 'many-to-one',
 *   sourceTable: 'dcim_device',
 *   targetTable: 'dcim_manufacturer',
 *   sourceColumn: 'manufacturer_id',
 *   targetColumn: 'id',
 *   fieldName: 'manufacturer',
 *   isJunctionTable: false,
 *   original: pgForeignKey
 * };
 * ```
 */
export interface FKMetadata {
  /** Direction of this relationship (forward/reverse) */
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

  /** Inferred GraphQL field name (e.g., 'manufacturer' from 'manufacturer_id') */
  fieldName: string;

  /** Whether this is a many-to-many junction table relationship */
  isJunctionTable?: boolean;

  /** Original PG FK data for debugging and auditing */
  original: PgForeignKey;
}

/**
 * Lookup map for fast FK metadata access during graph building
 *
 * Key format: "TypeName.fieldName" (e.g., "DeviceType.manufacturer")
 * Value: Complete FK metadata for that relationship
 *
 * This provides O(1) access to FK information when building graph edges.
 *
 * @example
 * ```typescript
 * const lookup: FKLookupMap = new Map([
 *   ['DeviceType.manufacturer', manufacturerMetadata],
 *   ['DeviceType.platform', platformMetadata],
 *   // ... more entries
 * ]);
 *
 * // Fast lookup during graph building
 * const metadata = lookup.get('DeviceType.manufacturer');
 * ```
 */
export type FKLookupMap = Map<string, FKMetadata>;

/**
 * Statistics about FK parsing and mapping
 *
 * Used for monitoring data quality and coverage rates.
 * Helps identify unmapped tables and potential issues.
 */
export interface FKParseStats {
  /** Total number of foreign keys in source data */
  totalFKs: number;

  /** Number of forward FK entries created */
  forwardFKs: number;

  /** Number of reverse FK entries created (if tracked) */
  reverseFKs: number;

  /** Number of junction table (many-to-many) relationships detected */
  junctionTables: number;

  /** Number of self-referencing FKs (e.g., parent_id → same table) */
  selfReferences: number;

  /** Number of FKs that failed to parse or map */
  parseErrors: number;

  /** Number of tables that couldn't be mapped to GraphQL types */
  unmappedTables?: number;

  /** Coverage rate as a percentage (0-100) */
  coverageRate?: number;
}

/**
 * Options for FK parsing operations
 */
export interface FKParseOptions {
  /** Whether to include reverse relationship entries in the lookup map */
  includeReverseRelationships?: boolean;

  /** Whether to log warnings for unmapped tables */
  logWarnings?: boolean;

  /** Maximum number of parse errors before aborting */
  maxErrors?: number;
}
