import { useState, useCallback } from 'react';
import { introspectType, IntrospectionType } from '../lib/graphql/introspection';

interface TypeCache {
  types: Map<string, IntrospectionType>;
  fetchedAt: Map<string, Date>;
}

export interface FetchTypeResult {
  type: IntrospectionType | null;
  fromCache: boolean;
  error?: string;
}

export interface UseTypeFetcherResult {
  fetchType: (typename: string) => Promise<FetchTypeResult>;
  fetchMultipleTypes: (typenames: string[]) => Promise<Map<string, IntrospectionType>>;
  getType: (typename: string) => IntrospectionType | undefined;
  clearCache: () => void;
  cacheSize: number;
}

/**
 * React hook for fetching and caching GraphQL types
 * Maintains in-memory cache to avoid redundant API calls
 *
 * @returns Type fetching functions and cache utilities
 */
export function useTypeFetcher(): UseTypeFetcherResult {
  const [cache, setCache] = useState<TypeCache>({
    types: new Map(),
    fetchedAt: new Map(),
  });

  /**
   * Retrieves type from cache without fetching
   *
   * @param typename - Type to retrieve
   * @returns Cached type data or undefined
   */
  const getType = useCallback(
    (typename: string): IntrospectionType | undefined => {
      return cache.types.get(typename);
    },
    [cache]
  );

  /**
   * Fetches a single type, using cache if available
   *
   * @param typename - Type to fetch
   * @returns Type data, cache status, and any errors
   */
  const fetchType = useCallback(
    async (typename: string): Promise<FetchTypeResult> => {
      // Check cache first
      const cachedType = cache.types.get(typename);
      if (cachedType) {
        return {
          type: cachedType,
          fromCache: true,
        };
      }

      // Fetch from API
      try {
        const type = await introspectType(typename);

        // Update cache
        setCache((prev) => {
          const newTypes = new Map(prev.types);
          const newFetchedAt = new Map(prev.fetchedAt);

          newTypes.set(typename, type);
          newFetchedAt.set(typename, new Date());

          return {
            types: newTypes,
            fetchedAt: newFetchedAt,
          };
        });

        return {
          type,
          fromCache: false,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch type:', { typename, error: errorMessage });

        return {
          type: null,
          fromCache: false,
          error: errorMessage,
        };
      }
    },
    [cache]
  );

  /**
   * Fetches multiple types in parallel
   * Uses cache for already-loaded types, fetches missing ones
   *
   * @param typenames - Array of type names to fetch
   * @returns Map of typename to introspection data
   */
  const fetchMultipleTypes = useCallback(
    async (typenames: string[]): Promise<Map<string, IntrospectionType>> => {
      // Separate cached and missing types
      const cachedTypes: string[] = [];
      const missingTypes: string[] = [];

      typenames.forEach((typename) => {
        if (cache.types.has(typename)) {
          cachedTypes.push(typename);
        } else {
          missingTypes.push(typename);
        }
      });

      // Fetch missing types in parallel
      const fetchPromises = missingTypes.map((typename) => fetchType(typename));
      const fetchResults = await Promise.all(fetchPromises);

      // Build result map
      const resultMap = new Map<string, IntrospectionType>();

      // Add cached types
      cachedTypes.forEach((typename) => {
        const type = cache.types.get(typename);
        if (type) {
          resultMap.set(typename, type);
        }
      });

      // Add newly fetched types
      fetchResults.forEach((result) => {
        if (result.type) {
          resultMap.set(result.type.name, result.type);
        }
      });

      return resultMap;
    },
    [cache, fetchType]
  );

  /**
   * Clears all cached types
   * Useful for forcing a refresh
   */
  const clearCache = useCallback(() => {
    setCache({
      types: new Map(),
      fetchedAt: new Map(),
    });
  }, [cache]);

  return {
    fetchType,
    fetchMultipleTypes,
    getType,
    clearCache,
    cacheSize: cache.types.size,
  };
}
