import { useCallback, useMemo } from 'react';
import { discoverAllTypes } from '../lib/graphql/introspection';
import { useAsyncResource } from './useAsyncResource';
import { getErrorMessage } from '../lib/utils/errors';

/**
 * State returned by the type discovery hook
 * @property types - Array of discovered OBJECT type names from GraphQL schema
 * @property loading - Whether type discovery is in progress
 * @property error - Error message if discovery failed, null otherwise
 */
export interface TypeDiscoveryState {
  types: string[];
  loading: boolean;
  error: string | null;
}

export function useTypeDiscovery(): TypeDiscoveryState {
  const discoverTypes = useCallback(async () => {
    console.log('[useTypeDiscovery] Initiating type discovery');

    const startTime = Date.now();

    try {
      const discoveredTypes = await discoverAllTypes();
      const duration = Date.now() - startTime;

      console.log('[useTypeDiscovery] Success:', {
        typesFound: discoveredTypes.length,
        duration: `${duration}ms`,
      });

      return discoveredTypes;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      console.error('[useTypeDiscovery] Failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const { data, loading, error } = useAsyncResource(discoverTypes, {
    initialValue: () => [],
  });

  return useMemo(
    () => ({
      types: data,
      loading,
      error,
    }),
    [data, error, loading]
  );
}
