/**
 * Utility functions for GraphQL type name transformations
 * Provides consistent display name handling across the application
 */

/**
 * Represents a GraphQL type with both its original name and display name
 */
export interface TypeInfo {
  /** Original GraphQL typename (e.g., "DeviceType", "VRFType") */
  typename: string;
  /** Cleaned display name without "Type" suffix (e.g., "Device", "VRF") */
  displayName: string;
}

/**
 * Converts GraphQL typename to display name by removing "Type" suffix
 * Handles special cases and edge cases
 *
 * Examples:
 *   DeviceType -> Device
 *   InterfaceType -> Interface
 *   VRFType -> VRF
 *   IPAddressType -> IPAddress
 *   Query -> Query (no change)
 *
 * @param typename - Original GraphQL type name
 * @returns Cleaned display name
 */
export function getDisplayName(typename: string): string {
  if (typename.endsWith('Type')) {
    return typename.slice(0, -4);
  }
  return typename;
}

/**
 * Creates a TypeInfo object from a typename
 *
 * @param typename - Original GraphQL typename
 * @returns TypeInfo with typename and displayName
 */
export function createTypeInfo(typename: string): TypeInfo {
  return {
    typename,
    displayName: getDisplayName(typename),
  };
}

/**
 * Converts an array of typenames to TypeInfo objects
 *
 * @param typenames - Array of GraphQL typenames
 * @returns Array of TypeInfo objects
 */
export function createTypeInfoList(typenames: string[]): TypeInfo[] {
  return typenames.map(createTypeInfo);
}

/**
 * Finds TypeInfo by typename
 *
 * @param typeInfos - Array of TypeInfo objects
 * @param typename - Typename to search for
 * @returns TypeInfo if found, undefined otherwise
 */
export function findTypeInfo(typeInfos: TypeInfo[], typename: string): TypeInfo | undefined {
  return typeInfos.find(info => info.typename === typename);
}

/**
 * Finds TypeInfo by displayName
 *
 * @param typeInfos - Array of TypeInfo objects
 * @param displayName - Display name to search for
 * @returns TypeInfo if found, undefined otherwise
 */
export function findTypeInfoByDisplayName(typeInfos: TypeInfo[], displayName: string): TypeInfo | undefined {
  return typeInfos.find(info => info.displayName === displayName);
}

/**
 * Extracts typenames from TypeInfo array
 *
 * @param typeInfos - Array of TypeInfo objects
 * @returns Array of typenames
 */
export function extractTypenames(typeInfos: TypeInfo[]): string[] {
  return typeInfos.map(info => info.typename);
}

/**
 * Extracts display names from TypeInfo array
 *
 * @param typeInfos - Array of TypeInfo objects
 * @returns Array of display names
 */
export function extractDisplayNames(typeInfos: TypeInfo[]): string[] {
  return typeInfos.map(info => info.displayName);
}
