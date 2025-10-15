/**
 * Name Mapper - Bidirectional mapping between PostgreSQL tables and GraphQL types
 *
 * This module solves the critical problem of translating between database
 * table names (snake_case) and GraphQL type names (PascalCase with Type suffix).
 *
 * Special handling for:
 * - Acronyms (IP, VLAN, VRF) that must stay uppercase
 * - Compound words (IPAddress, VMInterface)
 * - Edge cases that don't follow standard patterns
 */

import { TableToTypeMapper } from './fkLookup';

/**
 * Known acronyms that should remain uppercase in GraphQL types
 *
 * These are treated as atomic units rather than being split into
 * separate words. For example, "VLAN" stays "VLAN", not "Vlan".
 */
const ACRONYMS = new Set([
  'IP',
  'VRF',
  'VLAN',
  'VM',
  'API',
  'URL',
  'HTTP',
  'HTTPS',
  'DNS',
  'BGP',
  'OSPF',
  'SNMP',
  'SSH',
  'ACL',
  'NAT',
  'VPN',
  'MAC',
  'MTU',
  'QOS',
  'STP',
  'VXLAN',
  'LACP',
  'RIR', // Regional Internet Registry
]);

/**
 * Special case overrides for non-standard mappings
 *
 * These tables don't follow the standard naming pattern and need
 * explicit mapping. Add entries here as you discover edge cases.
 *
 * Key: PostgreSQL table name
 * Value: GraphQL type name
 */
const SPECIAL_CASE_OVERRIDES: Record<string, string> = {
  // IP address special handling (compound acronym)
  ipam_ipaddress: 'IPAddressType',

  // Acronyms that must stay uppercase
  ipam_vrf: 'VRFType',
  ipam_vlan: 'VLANType',
  ipam_rir: 'RIRType',

  // VM related (compound acronym)
  virtualization_virtualmachine: 'VirtualMachineType',
  virtualization_vminterface: 'VMInterfaceType',

  // Other special cases
  // Add more as discovered during testing
};

/**
 * Statistics about name mapping operations
 */
export interface NameMapperStats {
  /** Total number of mappings attempted */
  totalMappings: number;

  /** Number of successful mappings */
  successfulMappings: number;

  /** Number of failed mappings */
  failedMappings: number;

  /** Number of special case overrides used */
  specialCaseOverrides: number;

  /** List of tables that couldn't be mapped */
  unmappedTables: string[];

  /** Coverage rate as percentage */
  coverageRate?: number;
}

/**
 * Name mapper implementation
 *
 * Provides bidirectional mapping between PostgreSQL tables and GraphQL types.
 * Implements the TableToTypeMapper interface for use with fkLookup.
 */
export class NameMapper implements TableToTypeMapper {
  private tableToTypeMap = new Map<string, string>();
  private typeToTableMap = new Map<string, string>();
  private stats: NameMapperStats;

  constructor(stats: NameMapperStats) {
    this.stats = stats;
  }

  tableToType(tableName: string): string | null {
    return this.tableToTypeMap.get(tableName) ?? null;
  }

  typeToTable(typeName: string): string | null {
    // Normalize type name (ensure it has 'Type' suffix)
    const normalized = typeName.endsWith('Type') ? typeName : typeName + 'Type';
    return this.typeToTableMap.get(normalized) ?? null;
  }

  hasMapping(identifier: string): boolean {
    return this.tableToTypeMap.has(identifier) || this.typeToTableMap.has(identifier);
  }

  getAllTables(): string[] {
    return Array.from(this.tableToTypeMap.keys()).sort();
  }

  getAllTypes(): string[] {
    return Array.from(this.typeToTableMap.keys()).sort();
  }

  getStats(): NameMapperStats {
    return { ...this.stats };
  }

  /** Internal method to add a mapping */
  addMapping(tableName: string, typeName: string): void {
    this.tableToTypeMap.set(tableName, typeName);
    this.typeToTableMap.set(typeName, tableName);
  }
}

/**
 * Build PostgreSQL table name from app label and model
 *
 * Standard Nautobot/Django pattern: {app_label}_{model}
 *
 * Reserved for future use with Content Types API.
 *
 * @param appLabel - Nautobot app label (e.g., "dcim")
 * @param model - Model name (e.g., "device")
 * @returns Table name (e.g., "dcim_device")
 */
export function buildTableName(appLabel: string, model: string): string {
  return `${appLabel}_${model}`;
}

/**
 * Build GraphQL type name from model name
 *
 * Handles acronyms, PascalCase conversion, and adds Type suffix.
 *
 * Reserved for future use with Content Types API.
 *
 * @param model - Model name from content type (e.g., "vlan", "device_type")
 * @returns GraphQL type name (e.g., "VLANType", "DeviceTypeType")
 *
 * @example
 * ```typescript
 * buildTypeName('device')  // 'DeviceType'
 * buildTypeName('vlan')  // 'VLANType'
 * buildTypeName('ipaddress')  // 'IPAddressType'
 * buildTypeName('device_type')  // 'DeviceTypeType'
 * ```
 */
export function buildTypeName(model: string): string {
  // Split by underscore
  const parts = model.split('_');

  // Convert each part to PascalCase, respecting acronyms
  const pascalParts = parts.map((part) => {
    const upper = part.toUpperCase();

    // Check if entire part is an acronym
    if (ACRONYMS.has(upper)) {
      return upper;
    }

    // Check for compound acronyms (special hardcoded cases)
    // These need to be handled specially because they don't split nicely
    if (part === 'ipaddress') return 'IPAddress';
    if (part === 'vminterface') return 'VMInterface';
    if (part === 'virtualmachine') return 'VirtualMachine';

    // Standard PascalCase: capitalize first letter, lowercase rest
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });

  // Join and add 'Type' suffix
  return pascalParts.join('') + 'Type';
}

/**
 * Build name mapper from Nautobot content types or discovered types
 *
 * This is the primary entry point for creating a name mapper.
 * It processes type information and builds bidirectional mappings.
 *
 * @param typeInfos - Array of type information with typename
 * @returns Configured name mapper instance
 *
 * @example
 * ```typescript
 * // From type discovery
 * const { typeInfos } = useTypeDiscovery();
 * const nameMapper = buildNameMapper(typeInfos.map(t => t.typename));
 *
 * // Use mapper
 * const graphQLType = nameMapper.tableToType('dcim_device');
 * console.log(graphQLType);  // 'DeviceType'
 * ```
 */
export function buildNameMapper(typenames: string[]): NameMapper {
  const stats: NameMapperStats = {
    totalMappings: 0,
    successfulMappings: 0,
    failedMappings: 0,
    specialCaseOverrides: 0,
    unmappedTables: [],
  };

  const mapper = new NameMapper(stats);

  // Process each typename
  for (const typename of typenames) {
    stats.totalMappings++;

    try {
      // Infer table name from GraphQL typename
      // This is a reverse operation: DeviceType -> dcim_device
      const tableName = inferTableNameFromType(typename);

      if (tableName) {
        mapper.addMapping(tableName, typename);
        stats.successfulMappings++;
      } else {
        stats.failedMappings++;
      }
    } catch (error) {
      console.error(`Failed to map typename: ${typename}`, error);
      stats.failedMappings++;
    }
  }

  // Calculate coverage
  if (stats.totalMappings > 0) {
    stats.coverageRate = (stats.successfulMappings / stats.totalMappings) * 100;
  }

  // Log statistics
  console.log('Name Mapper Statistics:', {
    total: stats.totalMappings,
    successful: stats.successfulMappings,
    failed: stats.failedMappings,
    coverage: stats.coverageRate ? `${stats.coverageRate.toFixed(1)}%` : '0%',
  });

  return mapper;
}

/**
 * Infer PostgreSQL table name from GraphQL type name
 *
 * This is a heuristic-based approach that handles common patterns.
 * Not 100% accurate but works for most Nautobot types.
 *
 * @param typename - GraphQL type name (e.g., "DeviceType")
 * @returns Inferred table name (e.g., "dcim_device") or null
 *
 * @example
 * ```typescript
 * inferTableNameFromType('DeviceType')  // 'dcim_device'
 * inferTableNameFromType('VLANType')  // 'ipam_vlan'
 * inferTableNameFromType('IPAddressType')  // 'ipam_ipaddress'
 * ```
 */
export function inferTableNameFromType(typename: string): string | null {
  // Remove 'Type' suffix
  const base = typename.endsWith('Type') ? typename.slice(0, -4) : typename;

  // Check reverse special cases
  const reverseSpecialCases = getReverseSpecialCases();
  if (typename in reverseSpecialCases) {
    return reverseSpecialCases[typename];
  }

  // Convert PascalCase to snake_case with app prefix inference
  const snakeCaseModel = pascalToSnake(base);

  // Infer app prefix based on type name patterns
  const appPrefix = inferAppPrefix(base);

  return appPrefix ? `${appPrefix}_${snakeCaseModel}` : null;
}

/**
 * Build reverse mapping of special cases
 */
function getReverseSpecialCases(): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [table, type] of Object.entries(SPECIAL_CASE_OVERRIDES)) {
    reverse[type] = table;
  }
  return reverse;
}

/**
 * Convert PascalCase to snake_case
 *
 * @param str - PascalCase string
 * @returns snake_case string
 *
 * @example
 * ```typescript
 * pascalToSnake('Device')  // 'device'
 * pascalToSnake('DeviceType')  // 'device_type'
 * pascalToSnake('VLANGroup')  // 'vlan_group'
 * pascalToSnake('IPAddress')  // 'ipaddress'
 * ```
 */
export function pascalToSnake(str: string): string {
  // Handle acronyms by converting them to lowercase first
  // IPAddress -> ipaddress
  // VLANGroup -> vlangroup (will be fixed below)

  // Insert underscore before uppercase letters (except at start)
  const withUnderscores = str.replace(/([A-Z])/g, (_match, letter, offset) => {
    return offset > 0 ? '_' + letter.toLowerCase() : letter.toLowerCase();
  });

  // Clean up double underscores
  return withUnderscores.replace(/__+/g, '_');
}

/**
 * Infer app prefix from type name
 *
 * Uses heuristics based on common naming patterns.
 *
 * @param basename - Type name without 'Type' suffix
 * @returns App prefix or null if can't infer
 */
export function inferAppPrefix(basename: string): string | null {
  // DCIM types (most common)
  const dcimPatterns = [
    'Device', 'Rack', 'Interface', 'Cable', 'Power', 'Console',
    'Location', 'Manufacturer', 'Platform', 'Module',
  ];
  if (dcimPatterns.some(p => basename.includes(p))) {
    return 'dcim';
  }

  // IPAM types
  const ipamPatterns = [
    'IP', 'VLAN', 'VRF', 'Prefix', 'Namespace', 'RIR', 'Route',
  ];
  if (ipamPatterns.some(p => basename.includes(p))) {
    return 'ipam';
  }

  // Circuits types
  const circuitsPatterns = ['Circuit', 'Provider'];
  if (circuitsPatterns.some(p => basename.includes(p))) {
    return 'circuits';
  }

  // Tenancy types
  const tenancyPatterns = ['Tenant'];
  if (tenancyPatterns.some(p => basename.includes(p))) {
    return 'tenancy';
  }

  // Virtualization types
  const virtualizationPatterns = ['VM', 'Virtual', 'Cluster'];
  if (virtualizationPatterns.some(p => basename.includes(p))) {
    return 'virtualization';
  }

  // Extras types
  const extrasPatterns = [
    'Tag', 'Status', 'Role', 'Webhook', 'CustomField', 'Job',
    'ConfigContext', 'Contact', 'Team', 'Secret', 'Note',
  ];
  if (extrasPatterns.some(p => basename.includes(p))) {
    return 'extras';
  }

  // Users/Auth types
  const usersPatterns = ['User', 'Group', 'Permission', 'Token'];
  if (usersPatterns.some(p => basename.includes(p))) {
    return 'users';
  }

  // Cloud types
  const cloudPatterns = ['Cloud'];
  if (cloudPatterns.some(p => basename.includes(p))) {
    return 'cloud';
  }

  // Couldn't infer - this might be a custom app
  return null;
}

/**
 * Export mappings as CSV for review
 *
 * Useful for validating mappings and finding patterns.
 *
 * @param mapper - Name mapper instance
 * @returns CSV-formatted string
 *
 * @example
 * ```typescript
 * const mapper = buildNameMapper(typenames);
 * const csv = exportMappingsAsCSV(mapper);
 * console.log(csv);
 * // Or save to file
 * ```
 */
export function exportMappingsAsCSV(mapper: NameMapper): string {
  const rows = ['Table Name,GraphQL Type'];

  for (const table of mapper.getAllTables()) {
    const type = mapper.tableToType(table);
    rows.push(`${table},${type}`);
  }

  return rows.join('\n');
}
