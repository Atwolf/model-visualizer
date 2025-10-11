import { ContentType } from '../graphql/client';

/**
 * Maps GraphQL type names to Nautobot content types
 * to identify which types correspond to primary Django models.
 *
 * GraphQL types follow the pattern: ModelNameType (e.g., "ManufacturerType")
 * Content types use lowercase model names (e.g., "manufacturer")
 */

/**
 * Converts a GraphQL type name to its expected model name
 * Removes "Type" suffix and converts to lowercase
 *
 * Examples:
 *   "ManufacturerType" -> "manufacturer"
 *   "DeviceType" -> "device"
 *   "IPAddressType" -> "ipaddress"
 *
 * @param graphqlTypename - GraphQL type name (e.g., "ManufacturerType")
 * @returns Normalized model name for matching
 */
export function normalizeGraphQLTypeName(graphqlTypename: string): string {
  // Remove "Type" suffix if present
  let normalized = graphqlTypename;
  if (normalized.endsWith('Type')) {
    normalized = normalized.slice(0, -4);
  }

  // Convert to lowercase for case-insensitive matching
  return normalized.toLowerCase();
}

/**
 * Builds a Set of model names from content types for fast lookup
 *
 * @param contentTypes - Array of content types from Nautobot API
 * @returns Set of lowercase model names
 */
export function buildContentTypeModelSet(contentTypes: ContentType[]): Set<string> {
  const modelSet = new Set<string>();

  for (const contentType of contentTypes) {
    // Store lowercase model name for case-insensitive matching
    modelSet.add(contentType.model.toLowerCase());
  }

  console.log('[ContentTypeMapper] Built model set:', {
    totalModels: modelSet.size,
    sampleModels: Array.from(modelSet).slice(0, 10),
  });

  return modelSet;
}

/**
 * Checks if a GraphQL type corresponds to a primary Nautobot model
 *
 * @param graphqlTypename - GraphQL type name to check (e.g., "ManufacturerType")
 * @param contentTypeModels - Set of model names from content types
 * @returns true if the GraphQL type maps to a primary model
 */
export function isPrimaryModel(
  graphqlTypename: string,
  contentTypeModels: Set<string>
): boolean {
  const normalizedName = normalizeGraphQLTypeName(graphqlTypename);
  const isPrimary = contentTypeModels.has(normalizedName);

  if (isPrimary) {
    console.log('[ContentTypeMapper] Primary model detected:', {
      graphqlType: graphqlTypename,
      modelName: normalizedName,
    });
  }

  return isPrimary;
}

/**
 * Creates a mapping function for checking if types are primary models
 *
 * @param contentTypes - Array of content types from Nautobot API
 * @returns Function that checks if a GraphQL type is a primary model
 */
export function createPrimaryModelChecker(
  contentTypes: ContentType[]
): (typename: string) => boolean {
  const modelSet = buildContentTypeModelSet(contentTypes);

  return (typename: string) => isPrimaryModel(typename, modelSet);
}
