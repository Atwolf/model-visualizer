import { useState, useEffect } from 'react';
import { discoverAllTypes } from '../lib/graphql/introspection';

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
  const [state, setState] = useState<TypeDiscoveryState>({
    types: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function discover() {
      console.log('[useTypeDiscovery] Initiating type discovery');

      try {
        const startTime = Date.now();
        const discoveredTypes = await discoverAllTypes();
        const duration = Date.now() - startTime;

        if (!mounted) return;

        console.log('[useTypeDiscovery] Success:', {
          typesFound: discoveredTypes.length,
          duration: `${duration}ms`,
        });

        setState({
          types: discoveredTypes,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useTypeDiscovery] Failed:', errorMessage);

        setState({
          types: [],
          loading: false,
          error: errorMessage,
        });
      }
    }

    discover();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
