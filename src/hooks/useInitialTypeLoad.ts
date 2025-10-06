import { useState, useEffect } from 'react';
import { loadDefaultTypes } from '../lib/graphql/typeLoader';
import { IntrospectionType } from '../lib/graphql/introspection';

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
  const [types, setTypes] = useState<Map<string, IntrospectionType>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadDefaultTypes();

      // If all types failed, set error
      if (result.failed.length > 0 && result.successful.length === 0) {
        const errorMessages = result.failed.map((f) => f.typename).join(', ');
        setError(`Failed to load all types: ${errorMessages}`);
        setTypes(new Map());
        return;
      }

      // If some types failed, log warning but continue
      if (result.failed.length > 0) {
        console.warn('Some types failed to load:', result.failed);
      }

      // Build type map from successful loads
      const typeMap = new Map<string, IntrospectionType>();
      result.successful.forEach((loadResult) => {
        typeMap.set(loadResult.typename, loadResult.data);
      });

      setTypes(typeMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading types';
      setError(errorMessage);
      setTypes(new Map());
    } finally {
      setLoading(false);
    }
  };

  // Load types on mount
  useEffect(() => {
    loadTypes();
  }, []); // Empty dependency array = run once on mount

  return {
    types,
    loading,
    error,
    reload: loadTypes,
  };
}
