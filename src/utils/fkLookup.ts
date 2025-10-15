/**
 * Foreign Key Lookup Map Builder
 *
 * Creates an efficient lookup map for O(1) access to FK metadata during graph construction.
 * Integrates with table-to-type name mapping to create GraphQL-compatible lookup keys.
 */

import {
  PgForeignKey,
  FKMetadata,
  FKLookupMap,
  FKParseStats
} from '../types/fkMetadata';
import { inferFieldName, isJunctionTable, isSelfReference } from './fieldNameInference';

/**
 * Interface for table-to-type name mapping
 * Implemented in Task 2, stubbed here for type safety
 */
export interface TableToTypeMapper {
  /**
   * Convert PostgreSQL table name to GraphQL type name
   * @param tableName - PostgreSQL table name (e.g., "dcim_device")
   * @returns GraphQL type name (e.g., "DeviceType") or null if no mapping
   */
  tableToType(tableName: string): string | null;

  /**
   * Check if a mapping exists for this table
   * @param tableName - PostgreSQL table name
   * @returns True if mapping exists
   */
  hasMapping(tableName: string): boolean;
}

/**
 * Build FK lookup map from parsed foreign keys
 * Creates a map with composite keys for O(1) lookup during graph building
 *
 * @param foreignKeys - Parsed foreign keys from source_target.json
 * @param nameMapper - Table to GraphQL type name mapper (from Task 2)
 * @returns Map with keys like "DeviceType.manufacturer" -> FKMetadata
 */
export function buildFKLookupMap(
  foreignKeys: PgForeignKey[],
  nameMapper: TableToTypeMapper
): FKLookupMap {
  const lookup = new Map<string, FKMetadata>();
  const stats: FKParseStats = {
    totalFKs: foreignKeys.length,
    forwardFKs: 0,
    reverseFKs: 0,
    junctionTables: 0,
    selfReferences: 0,
    parseErrors: 0
  };

  const unmappedTables = new Set<string>();

  for (const fk of foreignKeys) {
    try {
      // Convert table names to GraphQL types
      const sourceType = nameMapper.tableToType(fk.source_table);
      const targetType = nameMapper.tableToType(fk.target_table);

      // Track unmapped tables
      if (!sourceType) {
        unmappedTables.add(fk.source_table);
      }
      if (!targetType) {
        unmappedTables.add(fk.target_table);
      }

      // Skip if we can't map both sides
      if (!sourceType || !targetType) {
        stats.parseErrors++;
        continue;
      }

      // Infer field name from column name
      const fieldName = inferFieldName(fk.source_column);

      // Detect special relationship types
      const isJunction = isJunctionTable(fk.source_table);
      const isSelfRef = isSelfReference(fk);

      if (isJunction) stats.junctionTables++;
      if (isSelfRef) stats.selfReferences++;

      // Create forward FK metadata (the actual FK field)
      const forwardMeta: FKMetadata = {
        direction: 'forward',
        cardinality: isJunction ? 'many-to-many' : 'many-to-one',
        sourceTable: fk.source_table,
        targetTable: fk.target_table,
        sourceColumn: fk.source_column,
        targetColumn: fk.target_column,
        fieldName,
        isJunctionTable: isJunction,
        original: fk
      };

      // Add to lookup map
      const forwardKey = `${sourceType}.${fieldName}`;
      lookup.set(forwardKey, forwardMeta);
      stats.forwardFKs++;

      // Optionally add reverse relationship
      // This is helpful for understanding bidirectional relationships
      // but should be used carefully to avoid duplicate edges
      //
      // For now, we'll skip creating reverse entries and let GraphQL
      // introspection provide the reverse fields naturally
      // If needed in the future, uncomment below:

      /*
      const reverseFieldName = inferReverseFieldName(fk.source_table);
      const reverseMeta: FKMetadata = {
        direction: 'reverse',
        cardinality: isJunction ? 'many-to-many' : 'one-to-many',
        sourceTable: fk.target_table,
        targetTable: fk.source_table,
        sourceColumn: fk.target_column,
        targetColumn: fk.source_column,
        fieldName: reverseFieldName,
        isJunctionTable: isJunction,
        original: fk
      };

      const reverseKey = `${targetType}.${reverseFieldName}`;
      lookup.set(reverseKey, reverseMeta);
      stats.reverseFKs++;
      */
    } catch (error) {
      console.error(`Error processing FK: ${JSON.stringify(fk)}`, error);
      stats.parseErrors++;
    }
  }

  // Report unmapped tables
  if (unmappedTables.size > 0) {
    console.warn(
      `${unmappedTables.size} tables could not be mapped to GraphQL types:`,
      Array.from(unmappedTables).sort()
    );
  }

  // Report statistics
  console.log('FK Lookup Map Statistics:', {
    ...stats,
    lookupEntries: lookup.size,
    coverageRate: `${((stats.forwardFKs / stats.totalFKs) * 100).toFixed(1)}%`
  });

  return lookup;
}

/**
 * Get FK metadata for a specific type and field
 *
 * @param lookup - FK lookup map
 * @param typeName - GraphQL type name
 * @param fieldName - Field name
 * @returns FK metadata or undefined if not found
 */
export function getFKMetadata(
  lookup: FKLookupMap,
  typeName: string,
  fieldName: string
): FKMetadata | undefined {
  const key = `${typeName}.${fieldName}`;
  return lookup.get(key);
}

/**
 * Check if a type-field combination represents a FK
 *
 * @param lookup - FK lookup map
 * @param typeName - GraphQL type name
 * @param fieldName - Field name
 * @returns True if this is a FK relationship
 */
export function isFK(
  lookup: FKLookupMap,
  typeName: string,
  fieldName: string
): boolean {
  return lookup.has(`${typeName}.${fieldName}`);
}

/**
 * Simple stub implementation of TableToTypeMapper for testing
 * This will be replaced by the actual implementation in Task 2
 */
export class StubTableToTypeMapper implements TableToTypeMapper {
  private mappings: Map<string, string>;

  constructor() {
    this.mappings = new Map();
  }

  /**
   * Add a mapping for testing purposes
   */
  addMapping(tableName: string, typeName: string): void {
    this.mappings.set(tableName, typeName);
  }

  tableToType(tableName: string): string | null {
    return this.mappings.get(tableName) || null;
  }

  hasMapping(tableName: string): boolean {
    return this.mappings.has(tableName);
  }
}
