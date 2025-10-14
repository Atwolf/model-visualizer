import { useCallback } from 'react';
import { loadDefaultTypes } from '../lib/graphql/typeLoader';
import { IntrospectionType } from '../lib/graphql/introspection';
import { useAsyncResource } from './useAsyncResource';
import { getErrorMessage } from '../lib/utils/errors';

export interface UseInitialTypeLoadResult {
  types: Map<string, IntrospectionType>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * React hook to load default types on component mount
 * Manages loading state and caches loaded types
 *
 * @returns Loading state, loaded types, and reload function
 */
export function useInitialTypeLoad(): UseInitialTypeLoadResult {
  const loadTypes = useCallback(async (): Promise<Map<string, IntrospectionType>> => {
    try {
      const result = await loadDefaultTypes();

      if (result.failed.length > 0 && result.successful.length === 0) {
        const errorMessages = result.failed.map((f) => f.typename).join(', ');
        throw new Error(`Failed to load all types: ${errorMessages}`);
      }

      if (result.failed.length > 0) {
        console.warn('[useInitialTypeLoad] Some types failed to load:', result.failed);
      }

      const typeMap = new Map<string, IntrospectionType>();
      result.successful.forEach((loadResult) => {
        typeMap.set(loadResult.typename, loadResult.data);
      });

      return typeMap;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Unknown error loading types');
      console.error('[useInitialTypeLoad] Failed to load types:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const { data, loading, error, reload } = useAsyncResource(loadTypes, {
    initialValue: () => new Map<string, IntrospectionType>(),
  });

  const reloadTypes = useCallback(async () => {
    await reload();
  }, [reload]);

  return {
    types: data,
    loading,
    error,
    reload: reloadTypes,
  };
}
