/**
 * Type filtering for GraphQL schema visualization
 *
 * Filters types based on wildcard patterns to show only relevant types in the graph.
 * By default, shows only network-relevant types (Device*, Interface*, etc.)
 * and hides internal/system types (TagType, StatusType, etc.)
 */

/**
 * Configuration for type filtering
 */
export interface TypeFilterConfig {
  /** Patterns to match against type names (supports * wildcard) */
  includePatterns: string[];
  /** Whether filtering is enabled */
  enabled: boolean;
}

/**
 * Network-relevant type patterns that engineers typically care about
 */
const DEFAULT_INCLUDE_PATTERNS = [
  // Core network infrastructure
  'Device*',
  'Interface*',
  'Cable*',
  'Location*',
  'Rack*',
  'Power*',

  // IP addressing and networks
  'IPAddress*',
  'Prefix*',
  'VLAN*',
  'VRF*',
  'Namespace*',

  // Circuits and connectivity
  'Circuit*',
  'Provider*',
  'Termination*',
];

/**
 * Check if typename matches a wildcard pattern
 *
 * Supports:
 * - Exact match: "DeviceType" matches "DeviceType"
 * - Prefix: "DeviceType" matches "Device*"
 * - Suffix: "DeviceType" matches "*Type"
 * - Contains: "InterfaceType" matches "*Interface*"
 *
 * @param typename - The GraphQL type name to check
 * @param pattern - The pattern with optional * wildcards
 * @returns true if typename matches pattern
 */
export function matchesPattern(typename: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return typename === pattern;  // Exact match
  }

  // Convert wildcard pattern to regex
  // First escape all regex special characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Then replace * with .*
  const regexPattern = escaped.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);

  return regex.test(typename);
}

/**
 * Check if a typename should be included in the graph
 *
 * @param typename - The GraphQL type name to check
 * @param config - The filter configuration
 * @returns true if the type should be shown in the graph
 */
export function isTypeAllowed(
  typename: string,
  config: TypeFilterConfig
): boolean {
  // If filter disabled, show everything
  if (!config.enabled) {
    return true;
  }

  // If no patterns, hide everything
  if (config.includePatterns.length === 0) {
    return false;
  }

  // Show if matches any pattern
  return config.includePatterns.some(pattern =>
    matchesPattern(typename, pattern)
  );
}

/**
 * Create a default filter configuration with network-relevant patterns
 *
 * @returns A new TypeFilterConfig with default patterns and enabled=true
 */
export function createDefaultFilterConfig(): TypeFilterConfig {
  return {
    includePatterns: [...DEFAULT_INCLUDE_PATTERNS],
    enabled: true,
  };
}
