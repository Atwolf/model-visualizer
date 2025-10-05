import { useState, useCallback, useEffect } from 'react';
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
 * Global cache - persists across component re-renders and hook re-initializations
 * This ensures types fetched once are available throughout the app lifecycle
 */
const globalCache: TypeCache = {
  types: new Map(),
  fetchedAt: new Map(),
};

/**
 * Subscribers that get notified when cache changes
 */
const cacheSubscribers = new Set<() => void>();

function notifyCacheChange() {
  cacheSubscribers.forEach(callback => callback());
}

/**
 * React hook for fetching and caching GraphQL types
 * Uses global cache to persist data across component lifecycles
 *
 * @returns Type fetching functions and cache utilities
 */
export function useTypeFetcher(): UseTypeFetcherResult {
  const [cacheVersion, setCacheVersion] = useState(0);

  // Subscribe to cache changes
  useEffect(() => {
    const callback = () => setCacheVersion(v => v + 1);
    cacheSubscribers.add(callback);
    return () => {
      cacheSubscribers.delete(callback);
    };
  }, []);

  /**
   * Retrieves type from cache without fetching
   *
   * @param typename - Type to retrieve
   * @returns Cached type data or undefined
   */
  const getType = useCallback(
    (typename: string): IntrospectionType | undefined => {
      return globalCache.types.get(typename);
    },
    []
  );

  /**
   * Fetches a single type, using cache if available
   *
   * @param typename - Type to fetch
   * @returns Type data, cache status, and any errors
   */
  const fetchType = useCallback(
    async (typename: string): Promise<FetchTypeResult> => {
      // Check global cache first
      const cachedType = globalCache.types.get(typename);

      if (cachedType) {
        return {
          type: cachedType,
          fromCache: true,
        };
      }

      // Fetch from API
      try {
        const type = await introspectType(typename);

        // Update global cache
        globalCache.types.set(typename, type);
        globalCache.fetchedAt.set(typename, new Date());

        // Notify subscribers
        notifyCacheChange();

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
    [] // No dependencies - stable function reference
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
      console.log('📥 fetchMultipleTypes called with:', typenames);

      // Separate cached and missing types using global cache
      const cachedTypes: string[] = [];
      const missingTypes: string[] = [];

      typenames.forEach((typename) => {
        if (globalCache.types.has(typename)) {
          cachedTypes.push(typename);
        } else {
          missingTypes.push(typename);
        }
      });

      console.log('📊 Type fetch request:', {
        total: typenames.length,
        cached: cachedTypes.length,
        toFetch: missingTypes.length,
        globalCacheSize: globalCache.types.size,
      });

      // Fetch missing types in parallel
      const fetchPromises = missingTypes.map((typename) => fetchType(typename));
      const fetchResults = await Promise.all(fetchPromises);

      // Build result map
      const resultMap = new Map<string, IntrospectionType>();

      // Add cached types from global cache
      cachedTypes.forEach((typename) => {
        const type = globalCache.types.get(typename);
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

      console.log('✅ Type fetch complete:', {
        returned: resultMap.size,
        cached: cachedTypes.length,
        fetched: fetchResults.filter((r) => r.type).length,
        globalCacheSize: globalCache.types.size,
      });

      return resultMap;
    },
    [fetchType] // Only depends on fetchType, which is now stable
  );

  /**
   * Clears all cached types
   * Useful for forcing a refresh
   */
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing global type cache');
    globalCache.types.clear();
    globalCache.fetchedAt.clear();
    notifyCacheChange();
  }, []); // No dependencies - stable function reference

  return {
    fetchType,
    fetchMultipleTypes,
    getType,
    clearCache,
    cacheSize: globalCache.types.size + cacheVersion * 0, // Include version to trigger re-renders
  };
}
