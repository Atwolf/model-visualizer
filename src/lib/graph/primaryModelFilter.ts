/**
 * Utility for filtering GraphQL types based on Nautobot primary models
 * Matches GraphQL type names to model_kinds.json primary model definitions
 */

import modelKinds from '../../defaults/model_kinds.json';

/**
 * Convert a Nautobot model name (e.g., "dcim.device") to possible GraphQL type name (e.g., "DeviceType")
 *
 * Pattern matching rules:
 * - "dcim.device" -> "DeviceType"
 * - "circuits.circuit" -> "CircuitType"
 * - "ipam.ipaddress" -> "IPAddressType"
 */
function modelNameToGraphQLType(modelName: string): string {
  // Split on dot: "dcim.device" -> ["dcim", "device"]
  const parts = modelName.split('.');
  if (parts.length !== 2) return '';

  const [, model] = parts;

  // Special cases for abbreviations
  const specialCases: Record<string, string> = {
    'ipaddress': 'IPAddress',
    'vrf': 'VRF',
    'vlan': 'VLAN',
    'rir': 'RIR',
  };

  // Check if model has a special case
  const baseName = specialCases[model.toLowerCase()] ||
    // Otherwise capitalize first letter
    model.charAt(0).toUpperCase() + model.slice(1);

  return `${baseName}Type`;
}

/**
 * Check if a GraphQL type name matches any primary model
 * Uses fuzzy matching to handle variations in naming conventions
 */
export function isPrimaryModel(typename: string): boolean {
  const primaryModels = modelKinds.data.primary;

  // Try direct GraphQL type match
  for (const modelName of primaryModels) {
    const expectedType = modelNameToGraphQLType(modelName);
    if (typename === expectedType) {
      return true;
    }
  }

  // Try case-insensitive partial matching as fallback
  const lowerTypename = typename.toLowerCase().replace('type', '');
  for (const modelName of primaryModels) {
    const modelPart = modelName.split('.')[1];
    if (lowerTypename === modelPart.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Filter a list of GraphQL types to only include primary models
 */
export function filterPrimaryModels(types: string[]): string[] {
  return types.filter(isPrimaryModel);
}

/**
 * Get statistics about primary model matching
 */
export function getPrimaryModelStats(types: string[]): {
  totalTypes: number;
  primaryModels: number;
  matchedTypes: string[];
} {
  const matchedTypes = filterPrimaryModels(types);

  return {
    totalTypes: types.length,
    primaryModels: matchedTypes.length,
    matchedTypes,
  };
}
