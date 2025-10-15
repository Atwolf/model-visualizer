/**
 * Field Name Inference Utilities
 *
 * Utilities for inferring GraphQL field names from PostgreSQL column names
 * and detecting special relationship patterns (junction tables, self-references).
 */

import { PgForeignKey } from '../types/fkMetadata';

/**
 * Infer GraphQL field name from PostgreSQL column name
 * Handles common patterns and special cases
 *
 * @param columnName - PostgreSQL column name (e.g., "manufacturer_id")
 * @returns GraphQL field name (e.g., "manufacturer")
 */
export function inferFieldName(columnName: string): string {
  // Handle special cases first
  const specialCases: Record<string, string> = {
    '_cable_peer_type_id': 'cablePeerType',
    'local_config_context_data_owner_content_type_id': 'localConfigContextDataOwnerContentType',
    '_termination_a_device_id': 'terminationADevice',
    '_termination_b_device_id': 'terminationBDevice',
    // Add more as discovered
  };

  if (columnName in specialCases) {
    return specialCases[columnName];
  }

  // Remove _id suffix (most common case)
  if (columnName.endsWith('_id')) {
    const base = columnName.slice(0, -3);
    return snakeToCamel(base);
  }

  // Default: convert snake_case to camelCase
  return snakeToCamel(columnName);
}

/**
 * Convert snake_case to camelCase
 *
 * @param str - Snake case string
 * @returns Camel case string
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Detect if a table is a many-to-many junction table
 * Common patterns:
 * - Contains "_to_" (e.g., "device_to_software_image")
 * - Contains double underscore between entities (e.g., "interface_tagged_vlans")
 * - Ends with plural association (e.g., "group_permissions")
 *
 * @param tableName - PostgreSQL table name
 * @returns True if likely a junction table
 */
export function isJunctionTable(tableName: string): boolean {
  // Pattern 1: explicit "_to_" connector
  if (tableName.includes('_to_')) return true;

  // Pattern 2: ends with plural like "_permissions", "_members", "_assignments"
  const junctionSuffixes = [
    '_permissions',
    '_members',
    '_users',
    '_groups',
    '_tags',
    '_vlans',
    '_types',
    '_locations',
    '_assignments',
    '_associations',
    '_targets',
    '_choices',
    '_queries'
  ];

  if (junctionSuffixes.some(suffix => tableName.endsWith(suffix))) {
    return true;
  }

  // Pattern 3: contains multiple underscores suggesting entity1_entity2 pattern
  const parts = tableName.split('_');
  if (parts.length >= 3) {
    // Check if it looks like app_entity1_entity2
    // where entity2 is plural
    const lastPart = parts[parts.length - 1];
    if (lastPart.endsWith('s') || lastPart.endsWith('es')) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if a foreign key is a self-reference
 *
 * @param fk - Foreign key to check
 * @returns True if source and target tables are the same
 */
export function isSelfReference(fk: PgForeignKey): boolean {
  return fk.source_table === fk.target_table;
}

/**
 * Infer reverse field name from source table name
 * Used for creating reverse relationship lookups
 *
 * @param tableName - Source table name
 * @returns Inferred reverse field name (plural)
 */
export function inferReverseFieldName(tableName: string): string {
  // Extract the entity name from the table name
  // e.g., "dcim_device" -> "device"
  const parts = tableName.split('_');
  const entity = parts[parts.length - 1];

  // Convert to camelCase and pluralize
  const camelEntity = snakeToCamel(entity);
  return pluralize(camelEntity);
}

/**
 * Simple pluralization for common cases
 * Note: This is a simplified version. For production, consider using a library like 'pluralize'
 *
 * @param word - Singular word
 * @returns Plural form
 */
function pluralize(word: string): string {
  // Handle common special cases
  const irregulars: Record<string, string> = {
    'person': 'people',
    'child': 'children',
    'foot': 'feet',
    'tooth': 'teeth',
  };

  if (word in irregulars) {
    return irregulars[word];
  }

  // Handle words ending in 'y'
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }

  // Handle words ending in 's', 'x', 'z', 'ch', 'sh'
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }

  // Default: add 's'
  return word + 's';
}
