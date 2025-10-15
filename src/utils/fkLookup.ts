/**
 * FK Lookup Map Builder - Creates efficient O(1) lookup for FK metadata
 *
 * This module builds a Map-based lookup structure that allows instant
 * access to FK metadata during graph construction. It bridges the gap
 * between PostgreSQL table names and GraphQL type names.
 */

import {
  PgForeignKey,
  FKMetadata,
  FKLookupMap,
  FKParseStats,
} from '../types/fkMetadata';
import {
  inferFieldName,
  isJunctionTable,
  isSelfReference,
} from './fieldNameInference';

/**
 * Interface for table-to-type name mapping
 *
 * This interface will be implemented by the NameMapper in Task 2.
 * For now, we define it here to maintain type safety and allow
 * independent development.
 */
export interface TableToTypeMapper {
  /**
   * Convert PostgreSQL table name to GraphQL type name
   *
   * @param tableName - PostgreSQL table name (e.g., "dcim_device")
   * @returns GraphQL type name (e.g., "DeviceType") or null if no mapping
   */
  tableToType(tableName: string): string | null;

  /**
   * Check if a mapping exists for this table
   *
   * @param tableName - PostgreSQL table name
   * @returns True if mapping exists
   */
  hasMapping(tableName: string): boolean;
}

/**
 * Stub implementation of TableToTypeMapper for testing
 *
 * This allows Task 1 to be developed and tested independently.
 * In production, use the real NameMapper from Task 2.
 *
 * @example
 * ```typescript
 * const mapper = new StubTableToTypeMapper();
 * mapper.addMapping('dcim_device', 'DeviceType');
 * mapper.addMapping('dcim_manufacturer', 'ManufacturerType');
 *
 * const fkLookup = buildFKLookupMap(foreignKeys, mapper);
 * ```
 */
export class StubTableToTypeMapper implements TableToTypeMapper {
  private mappings = new Map<string, string>();

  addMapping(tableName: string, typeName: string): void {
    this.mappings.set(tableName, typeName);
  }

  tableToType(tableName: string): string | null {
    return this.mappings.get(tableName) ?? null;
  }

  hasMapping(tableName: string): boolean {
    return this.mappings.has(tableName);
  }
}

/**
 * Build FK lookup map from parsed foreign keys
 *
 * Creates a Map with composite keys (TypeName.fieldName) for O(1) lookup.
 * Processes each FK to determine direction, cardinality, and field names.
 *
 * This is the core function that transforms database FK data into
 * GraphQL-aware relationship metadata.
 *
 * @param foreignKeys - Parsed foreign keys from sql_export.json
 * @param nameMapper - Table to GraphQL type name mapper
 * @returns Map with keys like "DeviceType.manufacturer" -> FKMetadata
 *
 * @example
 * ```typescript
 * import sqlExport from './data/sql_export.json';
 * import { parseForeignKeysFromModule } from './fkParser';
 * import { buildNameMapper } from './nameMapper';
 *
 * const foreignKeys = parseForeignKeysFromModule(sqlExport);
 * const nameMapper = buildNameMapper(contentTypes);
 * const fkLookup = buildFKLookupMap(foreignKeys, nameMapper);
 *
 * console.log(`Created lookup with ${fkLookup.size} entries`);
 *
 * // Use in graph building
 * const metadata = fkLookup.get('DeviceType.manufacturer');
 * if (metadata) {
 *   console.log(`Direction: ${metadata.direction}`);
 *   console.log(`Cardinality: ${metadata.cardinality}`);
 * }
 * ```
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
    parseErrors: 0,
    unmappedTables: 0,
  };

  const unmappedTables = new Set<string>();
  const processedKeys = new Set<string>(); // Track duplicates

  for (const fk of foreignKeys) {
    try {
      // Step 1: Convert table names to GraphQL types
      const sourceType = nameMapper.tableToType(fk.source_table);
      const targetType = nameMapper.tableToType(fk.target_table);

      // Track unmapped tables for reporting
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

      // Step 2: Infer GraphQL field name from column name
      const fieldName = inferFieldName(fk.source_column);

      // Step 3: Detect special relationship types
      const isJunction = isJunctionTable(fk.source_table);
      const isSelfRef = isSelfReference(fk);

      if (isJunction) stats.junctionTables++;
      if (isSelfRef) stats.selfReferences++;

      // Step 4: Create forward FK metadata (the actual FK field)
      const forwardMeta: FKMetadata = {
        direction: 'forward',
        cardinality: isJunction ? 'many-to-many' : 'many-to-one',
        sourceTable: fk.source_table,
        targetTable: fk.target_table,
        sourceColumn: fk.source_column,
        targetColumn: fk.target_column,
        fieldName,
        isJunctionTable: isJunction,
        original: fk,
      };

      // Step 5: Add to lookup map
      const forwardKey = `${sourceType}.${fieldName}`;

      // Check for duplicates (shouldn't happen in well-formed data)
      if (processedKeys.has(forwardKey)) {
        console.warn(`Duplicate FK key detected: ${forwardKey}`, {
          existing: lookup.get(forwardKey),
          new: forwardMeta,
        });
        stats.parseErrors++;
        continue;
      }

      lookup.set(forwardKey, forwardMeta);
      processedKeys.add(forwardKey);
      stats.forwardFKs++;

      // Note: We do NOT create reverse relationship entries here.
      // Reverse relationships are inferred from GraphQL introspection,
      // not from the FK data. This prevents duplicate edges.
      //
      // If you need reverse lookups in the future, add them here with
      // direction: 'reverse' and cardinality: 'one-to-many'.
    } catch (error) {
      console.error(`Error processing FK: ${JSON.stringify(fk)}`, error);
      stats.parseErrors++;
    }
  }

  // Step 6: Report statistics
  stats.unmappedTables = unmappedTables.size;

  if (unmappedTables.size > 0) {
    console.warn(
      `${unmappedTables.size} tables could not be mapped to GraphQL types:`,
      Array.from(unmappedTables).sort().slice(0, 20) // Show first 20
    );
    if (unmappedTables.size > 20) {
      console.warn(`... and ${unmappedTables.size - 20} more unmapped tables`);
    }
  }

  const coverageRate = stats.totalFKs > 0 ? (stats.forwardFKs / stats.totalFKs) * 100 : 0;
  stats.coverageRate = coverageRate;

  console.log('FK Lookup Map Statistics:', {
    totalFKs: stats.totalFKs,
    forwardFKs: stats.forwardFKs,
    lookupEntries: lookup.size,
    junctionTables: stats.junctionTables,
    selfReferences: stats.selfReferences,
    parseErrors: stats.parseErrors,
    unmappedTables: stats.unmappedTables,
    coverage: `${coverageRate.toFixed(1)}%`,
  });

  return lookup;
}

/**
 * Get FK metadata for a specific type and field
 *
 * Convenience function for looking up FK metadata during graph building.
 * Returns undefined if no FK exists for this type-field combination.
 *
 * @param lookup - FK lookup map
 * @param typeName - GraphQL type name (e.g., "DeviceType")
 * @param fieldName - Field name (e.g., "manufacturer")
 * @returns FK metadata or undefined if not found
 *
 * @example
 * ```typescript
 * const metadata = getFKMetadata(fkLookup, 'DeviceType', 'manufacturer');
 *
 * if (metadata) {
 *   console.log(`This is a ${metadata.direction} FK`);
 *   console.log(`Cardinality: ${metadata.cardinality}`);
 *   console.log(`Points to: ${metadata.targetTable}`);
 * } else {
 *   console.log('Not a FK field');
 * }
 * ```
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
 * Quick boolean check without retrieving full metadata.
 * Useful for fast filtering during graph operations.
 *
 * @param lookup - FK lookup map
 * @param typeName - GraphQL type name
 * @param fieldName - Field name
 * @returns True if this is a FK relationship
 *
 * @example
 * ```typescript
 * if (isFK(fkLookup, 'DeviceType', 'manufacturer')) {
 *   console.log('This field is a foreign key');
 * }
 * ```
 */
export function isFK(
  lookup: FKLookupMap,
  typeName: string,
  fieldName: string
): boolean {
  return lookup.has(`${typeName}.${fieldName}`);
}

/**
 * Get all FK metadata for a specific type
 *
 * Returns all FK relationships where the given type is the source.
 * Useful for analyzing a type's outgoing relationships.
 *
 * @param lookup - FK lookup map
 * @param typeName - GraphQL type name
 * @returns Array of FK metadata for all FK fields on this type
 *
 * @example
 * ```typescript
 * const deviceFKs = getFKsForType(fkLookup, 'DeviceType');
 *
 * console.log(`DeviceType has ${deviceFKs.length} FK relationships:`);
 * deviceFKs.forEach(fk => {
 *   console.log(`  - ${fk.fieldName} → ${fk.targetTable}`);
 * });
 * ```
 */
export function getFKsForType(lookup: FKLookupMap, typeName: string): FKMetadata[] {
  const results: FKMetadata[] = [];
  const prefix = `${typeName}.`;

  for (const [key, metadata] of lookup.entries()) {
    if (key.startsWith(prefix)) {
      results.push(metadata);
    }
  }

  return results;
}

/**
 * Get lookup map statistics
 *
 * Analyzes the lookup map to provide insights about FK coverage and types.
 *
 * @param lookup - FK lookup map
 * @returns Statistics object
 *
 * @example
 * ```typescript
 * const stats = getLookupStats(fkLookup);
 *
 * console.log(`Total FK entries: ${stats.totalEntries}`);
 * console.log(`Unique types: ${stats.uniqueTypes}`);
 * console.log(`Forward FKs: ${stats.forwardFKs}`);
 * console.log(`Junction tables: ${stats.junctionTables}`);
 * ```
 */
export function getLookupStats(lookup: FKLookupMap): {
  totalEntries: number;
  uniqueTypes: number;
  forwardFKs: number;
  reverseFKs: number;
  junctionTables: number;
  manyToOne: number;
  oneToMany: number;
  manyToMany: number;
} {
  const types = new Set<string>();
  let forwardFKs = 0;
  let reverseFKs = 0;
  let junctionTables = 0;
  let manyToOne = 0;
  let oneToMany = 0;
  let manyToMany = 0;

  for (const [key, metadata] of lookup.entries()) {
    // Extract type name from key (before the dot)
    const typeName = key.split('.')[0];
    types.add(typeName);

    // Count by direction
    if (metadata.direction === 'forward') forwardFKs++;
    if (metadata.direction === 'reverse') reverseFKs++;

    // Count by cardinality
    if (metadata.cardinality === 'many-to-one') manyToOne++;
    if (metadata.cardinality === 'one-to-many') oneToMany++;
    if (metadata.cardinality === 'many-to-many') manyToMany++;

    // Count junction tables
    if (metadata.isJunctionTable) junctionTables++;
  }

  return {
    totalEntries: lookup.size,
    uniqueTypes: types.size,
    forwardFKs,
    reverseFKs,
    junctionTables,
    manyToOne,
    oneToMany,
    manyToMany,
  };
}

/**
 * Debug utility: Export lookup map as JSON
 *
 * Converts the lookup map to a plain JavaScript object for inspection
 * or debugging. Useful for understanding what FKs were detected.
 *
 * @param lookup - FK lookup map
 * @returns Plain object representation
 *
 * @example
 * ```typescript
 * const debug = exportLookupMapForDebug(fkLookup);
 * console.log(JSON.stringify(debug, null, 2));
 *
 * // Or save to file
 * fs.writeFileSync('fk-lookup-debug.json', JSON.stringify(debug, null, 2));
 * ```
 */
export function exportLookupMapForDebug(lookup: FKLookupMap): Record<string, FKMetadata> {
  const result: Record<string, FKMetadata> = {};

  for (const [key, metadata] of lookup.entries()) {
    result[key] = metadata;
  }

  return result;
}
