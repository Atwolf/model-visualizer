/**
 * Foreign Key Data Loader
 *
 * Convenience utilities for loading the source_target.json file
 * and creating the FK lookup map.
 */

import sourceTargetData from '../defaults/source_target.json';
import { PgForeignKey, FKLookupMap } from '../types/fkMetadata';
import { parseForeignKeysFromModule } from './fkParser';
import { buildFKLookupMap, TableToTypeMapper } from './fkLookup';

/**
 * Load FK data from the bundled source_target.json file
 *
 * @returns Parsed foreign keys
 */
export function loadBundledFKData(): PgForeignKey[] {
  return parseForeignKeysFromModule(sourceTargetData);
}

/**
 * Create FK lookup map from bundled data
 *
 * @param nameMapper - Table to GraphQL type name mapper
 * @returns FK lookup map
 */
export function createFKLookupFromBundledData(
  nameMapper: TableToTypeMapper
): FKLookupMap {
  const foreignKeys = loadBundledFKData();
  return buildFKLookupMap(foreignKeys, nameMapper);
}

/**
 * Get FK statistics from bundled data
 *
 * @returns Statistics about the FK data
 */
export function getFKDataStats(): {
  totalRelationships: number;
  uniqueSourceTables: number;
  uniqueTargetTables: number;
  uniqueTables: number;
} {
  const foreignKeys = loadBundledFKData();
  const sourceTables = new Set(foreignKeys.map(fk => fk.source_table));
  const targetTables = new Set(foreignKeys.map(fk => fk.target_table));
  const allTables = new Set([...sourceTables, ...targetTables]);

  return {
    totalRelationships: foreignKeys.length,
    uniqueSourceTables: sourceTables.size,
    uniqueTargetTables: targetTables.size,
    uniqueTables: allTables.size
  };
}
