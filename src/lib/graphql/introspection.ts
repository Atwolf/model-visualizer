import { executeGraphQLQuery } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface IntrospectionField {
  name: string;
  description?: string;
  type: IntrospectionTypeRef;
  args?: IntrospectionInputValue[];
}

export interface IntrospectionTypeRef {
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL';
  name?: string;
  ofType?: IntrospectionTypeRef;
}

export interface IntrospectionType {
  name: string;
  kind: string;
  description?: string;
  fields?: IntrospectionField[];
  interfaces?: IntrospectionTypeRef[];
}

export interface IntrospectionInputValue {
  name: string;
  description?: string;
  type: IntrospectionTypeRef;
  defaultValue?: string;
}

interface TypeIntrospectionResult {
  __type: IntrospectionType;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

/**
 * Standard GraphQL introspection query for a specific type
 * Fetches all fields, their types, and nested type information
 */
export const TYPE_INTROSPECTION_QUERY = `
  query IntrospectType($typename: String!) {
    __type(name: $typename) {
      name
      kind
      description
      fields {
        name
        description
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
      interfaces {
        name
      }
    }
  }
`;

// ============================================================================
// Constants
// ============================================================================

/**
 * Standard GraphQL scalar types plus common custom scalars
 */
const SCALAR_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'ID',
  'DateTime',
  'Date',
  'Time',
  'JSON',
  'UUID',
  'Decimal',
  'BigInt',
]);

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Fetches introspection data for a specific GraphQL type
 *
 * @param typename - Name of the type to introspect (e.g., "DeviceType")
 * @returns Introspection data for the type including fields and relationships
 * @throws Error if type doesn't exist or introspection fails
 */
export async function introspectType(
  typename: string
): Promise<IntrospectionType> {
  const response = await executeGraphQLQuery<TypeIntrospectionResult>(
    TYPE_INTROSPECTION_QUERY,
    { typename }
  );

  // Handle GraphQL errors
  if (response.errors) {
    const errorMessages = response.errors.map(e => e.message).join(', ');
    throw new Error(`GraphQL introspection failed: ${errorMessages}`);
  }

  // Validate response structure
  if (!response.data || !response.data.__type) {
    throw new Error(`Type "${typename}" not found in schema`);
  }

  return response.data.__type;
}

/**
 * Unwraps nested type references to get the actual type name
 * Handles NON_NULL and LIST wrappers
 *
 * @param typeRef - Type reference to unwrap
 * @returns Unwrapped type information
 */
export function unwrapType(typeRef: IntrospectionTypeRef): {
  name: string;
  kind: string;
  isList: boolean;
  isNonNull: boolean;
} {
  let currentType = typeRef;
  let isList = false;
  let isNonNull = false;

  // Track the outermost NON_NULL wrapper
  if (currentType.kind === 'NON_NULL') {
    isNonNull = true;
    currentType = currentType.ofType!;
  }

  // Check for LIST wrapper
  if (currentType.kind === 'LIST') {
    isList = true;
    currentType = currentType.ofType!;
  }

  // Skip inner NON_NULL wrapper (for patterns like [Type!])
  if (currentType.kind === 'NON_NULL') {
    currentType = currentType.ofType!;
  }

  // At this point, we should have the actual type
  return {
    name: currentType.name || 'Unknown',
    kind: currentType.kind,
    isList,
    isNonNull,
  };
}

/**
 * Checks if a type is a GraphQL scalar type
 * Scalars: String, Int, Float, Boolean, ID, custom scalars
 *
 * @param typename - Type name to check
 * @returns True if type is a scalar
 */
export function isScalarType(typename: string): boolean {
  return SCALAR_TYPES.has(typename);
}

/**
 * Checks if a field represents a relationship to another object type
 * Filters out scalars and considers only object/interface types
 *
 * @param field - Field to check
 * @returns True if field is a relationship
 */
export function isRelationshipField(field: IntrospectionField): boolean {
  const unwrapped = unwrapType(field.type);

  // A field is a relationship if:
  // 1. It's not a scalar type
  // 2. It's an OBJECT or INTERFACE type
  const isObjectType = unwrapped.kind === 'OBJECT' || unwrapped.kind === 'INTERFACE';
  const isNotScalar = !isScalarType(unwrapped.name);

  return isObjectType && isNotScalar;
}
