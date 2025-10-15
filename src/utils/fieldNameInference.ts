/**
 * Field Name Inference - Converts PostgreSQL column names to GraphQL field names
 *
 * This module provides intelligent conversion of database column names
 * (snake_case with _id suffixes) to GraphQL field names (camelCase without _id).
 *
 * It also detects special relationship patterns like junction tables
 * and self-referencing foreign keys.
 */

import { PgForeignKey } from '../types/fkMetadata';

/**
 * Special cases mapping for columns that don't follow standard patterns
 *
 * Key: PostgreSQL column name
 * Value: GraphQL field name
 */
const SPECIAL_CASE_COLUMNS: Record<string, string> = {
  // Cable peer type special handling
  _cable_peer_type_id: 'cablePeerType',

  // Config context owner
  local_config_context_data_owner_content_type_id: 'localConfigContextDataOwnerContentType',
  owner_content_type_id: 'ownerContentType',

  // Termination types
  termination_a_type_id: 'terminationAType',
  termination_b_type_id: 'terminationType',

  // Content type references
  assigned_object_type_id: 'assignedObjectType',
  related_object_type_id: 'relatedObjectType',
  changed_object_type_id: 'changedObjectType',
  associated_object_type_id: 'associatedObjectType',
};

/**
 * Convert snake_case to camelCase
 *
 * Handles underscores as word boundaries and capitalizes the following letter.
 *
 * @param str - Snake case string
 * @returns Camel case string
 *
 * @example
 * ```typescript
 * snakeToCamel('device_type') // Returns: 'deviceType'
 * snakeToCamel('manufacturer_id') // Returns: 'manufacturerId'
 * snakeToCamel('_cable_peer') // Returns: 'cablePeer'
 * ```
 */
export function snakeToCamel(str: string): string {
  // Remove leading underscore for cleaner conversion
  const normalized = str.startsWith('_') ? str.slice(1) : str;

  return normalized.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Infer GraphQL field name from PostgreSQL column name
 *
 * Applies several heuristics:
 * 1. Check special cases first
 * 2. Remove _id suffix (most common FK pattern)
 * 3. Convert snake_case to camelCase
 * 4. Handle edge cases like leading underscores
 *
 * @param columnName - PostgreSQL column name (e.g., "manufacturer_id")
 * @returns GraphQL field name (e.g., "manufacturer")
 *
 * @example
 * ```typescript
 * // Standard FK patterns
 * inferFieldName('manufacturer_id')  // Returns: 'manufacturer'
 * inferFieldName('device_type_id')   // Returns: 'deviceType'
 *
 * // Special cases
 * inferFieldName('_cable_peer_type_id')  // Returns: 'cablePeerType'
 *
 * // Self-reference patterns
 * inferFieldName('parent_id')  // Returns: 'parent'
 * inferFieldName('master_id')  // Returns: 'master'
 *
 * // Non-FK columns (kept as-is after camelCase conversion)
 * inferFieldName('device_name')  // Returns: 'deviceName'
 * ```
 */
export function inferFieldName(columnName: string): string {
  // Step 1: Check special cases
  if (columnName in SPECIAL_CASE_COLUMNS) {
    return SPECIAL_CASE_COLUMNS[columnName];
  }

  // Step 2: Remove _id suffix (most common FK pattern)
  if (columnName.endsWith('_id')) {
    const base = columnName.slice(0, -3); // Remove '_id'
    return snakeToCamel(base);
  }

  // Step 3: Handle columns without _id suffix
  // (These might be non-standard FKs or just regular columns)
  return snakeToCamel(columnName);
}

/**
 * Detect if a table is a many-to-many junction table
 *
 * Junction tables typically follow these patterns:
 * - Contains "_to_" (e.g., "device_to_software_image")
 * - Ends with plural association (e.g., "group_permissions", "tagged_vlans")
 * - Three or more underscore segments with plural ending
 *
 * @param tableName - PostgreSQL table name
 * @returns True if likely a junction table
 *
 * @example
 * ```typescript
 * // Pattern 1: explicit "_to_" connector
 * isJunctionTable('device_to_software_image')  // true
 *
 * // Pattern 2: plural association suffix
 * isJunctionTable('auth_user_groups')  // true
 * isJunctionTable('interface_tagged_vlans')  // true
 * isJunctionTable('group_permissions')  // true
 *
 * // Not junction tables
 * isJunctionTable('dcim_device')  // false
 * isJunctionTable('ipam_vlan')  // false
 * ```
 */
export function isJunctionTable(tableName: string): boolean {
  // Pattern 1: explicit "_to_" connector
  if (tableName.includes('_to_')) {
    return true;
  }

  // Pattern 2: ends with plural association suffixes
  const junctionSuffixes = [
    '_permissions', // auth_group_permissions
    '_members', // group_members
    '_users', // permission_users
    '_groups', // user_groups
    '_tags', // interface_tags
    '_vlans', // interface_tagged_vlans
    '_types', // location_types
    '_locations', // vlan_locations
    '_assignments', // resource_assignments
    '_associations', // relationship_associations
    '_targets', // vrf_export_targets
    '_clusters', // configcontext_clusters
    '_platforms', // configcontext_platforms
    '_tenants', // configcontext_tenants
    '_content_types', // webhook_content_types
  ];

  if (junctionSuffixes.some((suffix) => tableName.endsWith(suffix))) {
    return true;
  }

  // Pattern 3: multiple underscores with plural ending
  // e.g., "dcim_interface_tagged_vlans" (app_entity1_entity2s pattern)
  const parts = tableName.split('_');
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    // Check if last part looks plural (ends with 's' or 'es')
    if (lastPart.endsWith('s') || lastPart.endsWith('es')) {
      // But exclude single-entity tables that just happen to be plural
      // e.g., "extras_status" -> not a junction table
      const isPluralEntity = parts.length === 2;
      return !isPluralEntity;
    }
  }

  return false;
}

/**
 * Detect if a foreign key is a self-reference
 *
 * Self-referencing FKs point back to the same table, typically used for
 * hierarchical data structures (parent/child) or cluster relationships (master/member).
 *
 * @param fk - Foreign key to check
 * @returns True if source and target tables are the same
 *
 * @example
 * ```typescript
 * const parentFK = {
 *   source_table: 'dcim_location',
 *   source_column: 'parent_id',
 *   target_table: 'dcim_location',  // Same table
 *   target_column: 'id'
 * };
 * isSelfReference(parentFK)  // true
 *
 * const normalFK = {
 *   source_table: 'dcim_device',
 *   source_column: 'manufacturer_id',
 *   target_table: 'dcim_manufacturer',  // Different table
 *   target_column: 'id'
 * };
 * isSelfReference(normalFK)  // false
 * ```
 */
export function isSelfReference(fk: PgForeignKey): boolean {
  return fk.source_table === fk.target_table;
}

/**
 * Infer reverse field name from source table name
 *
 * For reverse relationships (one-to-many), GraphQL typically pluralizes
 * the source entity name. This function generates a reasonable default.
 *
 * @param sourceTable - PostgreSQL source table name
 * @returns Inferred reverse field name in plural form
 *
 * @example
 * ```typescript
 * // From dcim_device.manufacturer_id → dcim_manufacturer
 * inferReverseFieldName('dcim_device')  // Returns: 'devices'
 *
 * // From ipam_interface.vlan_id → ipam_vlan
 * inferReverseFieldName('dcim_interface')  // Returns: 'interfaces'
 *
 * // Special pluralization rules
 * inferReverseFieldName('tenancy_tenancy')  // Returns: 'tenancies'
 * ```
 */
export function inferReverseFieldName(sourceTable: string): string {
  // Extract entity name (remove app prefix)
  const parts = sourceTable.split('_');
  if (parts.length < 2) {
    // Fallback for malformed table names
    return pluralize(sourceTable);
  }

  // For tables like "dcim_device", we want "device" -> "devices"
  const entityName = parts.slice(1).join('_');
  const camelEntity = snakeToCamel(entityName);

  return pluralize(camelEntity);
}

/**
 * Simple pluralization for English nouns
 *
 * Handles common rules but not all edge cases.
 * For production, consider using a library like 'pluralize'.
 *
 * @param word - Singular word
 * @returns Plural form
 *
 * @example
 * ```typescript
 * pluralize('device')  // 'devices'
 * pluralize('interface')  // 'interfaces'
 * pluralize('query')  // 'queries'
 * pluralize('status')  // 'statuses'
 * pluralize('child')  // 'children' (special case)
 * ```
 */
export function pluralize(word: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    child: 'children',
    person: 'people',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    foot: 'feet',
    mouse: 'mice',
    goose: 'geese',
  };

  const lowerWord = word.toLowerCase();
  if (lowerWord in specialCases) {
    // Preserve original casing
    const special = specialCases[lowerWord];
    return word[0] === word[0].toUpperCase()
      ? special.charAt(0).toUpperCase() + special.slice(1)
      : special;
  }

  // Already plural (ends with 's')
  if (word.endsWith('s')) {
    return word;
  }

  // Ends with 'y' preceded by consonant -> 'ies'
  if (word.endsWith('y') && word.length > 1) {
    const beforeY = word[word.length - 2];
    if (!/[aeiou]/i.test(beforeY)) {
      return word.slice(0, -1) + 'ies';
    }
  }

  // Ends with 's', 'x', 'z', 'ch', 'sh' -> add 'es'
  if (
    word.endsWith('s') ||
    word.endsWith('x') ||
    word.endsWith('z') ||
    word.endsWith('ch') ||
    word.endsWith('sh')
  ) {
    return word + 'es';
  }

  // Default: add 's'
  return word + 's';
}

/**
 * Detect common hierarchical relationship patterns
 *
 * Identifies columns that typically represent parent-child or hierarchical relationships.
 *
 * @param columnName - PostgreSQL column name
 * @returns True if column name suggests hierarchical relationship
 *
 * @example
 * ```typescript
 * isHierarchicalColumn('parent_id')  // true
 * isHierarchicalColumn('master_id')  // true
 * isHierarchicalColumn('root_id')  // true
 * isHierarchicalColumn('manufacturer_id')  // false
 * ```
 */
export function isHierarchicalColumn(columnName: string): boolean {
  const hierarchicalPatterns = [
    'parent_id',
    'master_id',
    'root_id',
    'ancestor_id',
    'super_id',
    'owner_id', // Sometimes hierarchical
  ];

  return hierarchicalPatterns.includes(columnName);
}
