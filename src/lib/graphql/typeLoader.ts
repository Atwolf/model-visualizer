import { introspectType, IntrospectionType } from './introspection';

/**
 * Default types to load on application startup
 * These serve as initial root node options
 */
export const DEFAULT_ROOT_TYPES = [
  'DeviceType',
  'CircuitType',
  'IPAddressType', // IPAM - most commonly used for network IP management
];

export interface TypeLoadResult {
  typename: string;
  data: IntrospectionType;
  timestamp: Date;
}

export interface TypeLoadError {
  typename: string;
  error: string;
}

export interface InitialLoadResult {
  successful: TypeLoadResult[];
  failed: TypeLoadError[];
  totalTime: number;
}

/**
 * Validates that loaded type has required structure
 * Checks for fields array and basic type information
 *
 * @param type - Introspection type to validate
 * @returns True if type is valid and usable
 */
function validateLoadedType(type: IntrospectionType): boolean {
  // Check that type has required basic properties
  if (!type || !type.name || !type.kind) {
    return false;
  }

  // Object types should have fields
  if (type.kind === 'OBJECT' && (!type.fields || type.fields.length === 0)) {
    return false;
  }

  return true;
}

/**
 * Loads a single type with error handling
 * Wraps introspectType with try-catch and timing
 *
 * @param typename - Type to load
 * @returns Load result with data or error
 */
async function loadSingleType(
  typename: string
): Promise<TypeLoadResult | TypeLoadError> {
  const startTime = Date.now();

  try {
    const data = await introspectType(typename);

    // Validate the loaded type
    if (!validateLoadedType(data)) {
      return {
        typename,
        error: 'Type loaded but failed validation (missing required fields)',
      };
    }

    const loadTime = Date.now() - startTime;
    console.log(`Loaded type ${typename} in ${loadTime}ms`);

    return {
      typename,
      data,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to load type:', { typename, error: errorMessage });

    return {
      typename,
      error: errorMessage,
    };
  }
}

/**
 * Loads all default types on application startup
 * Fetches types in parallel for better performance
 *
 * @returns Results of loading default types, including successes and failures
 */
export async function loadDefaultTypes(): Promise<InitialLoadResult> {
  const startTime = Date.now();

  console.log('Loading default types:', DEFAULT_ROOT_TYPES);

  // Load all types in parallel
  const results = await Promise.all(
    DEFAULT_ROOT_TYPES.map((typename) => loadSingleType(typename))
  );

  // Separate successful and failed loads
  const successful: TypeLoadResult[] = [];
  const failed: TypeLoadError[] = [];

  for (const result of results) {
    if ('data' in result) {
      successful.push(result);
    } else {
      failed.push(result);
    }
  }

  const totalTime = Date.now() - startTime;

  console.log('Type load complete:', {
    successful: successful.map((r) => r.typename),
    failed: failed.map((r) => r.typename),
    duration: totalTime + 'ms',
  });

  return {
    successful,
    failed,
    totalTime,
  };
}
