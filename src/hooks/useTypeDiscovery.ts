import { useState, useEffect } from 'react';
import { discoverAllTypes } from '../lib/graphql/introspection';
import { TypeInfo, createTypeInfoList } from '../lib/graph/typeUtils';

/**
 * State returned by the type discovery hook
 * @property typeInfos - Array of discovered types with typename and displayName
 * @property loading - Whether type discovery is in progress
 * @property error - Error message if discovery failed, null otherwise
 */
export interface TypeDiscoveryState {
  typeInfos: TypeInfo[];
  loading: boolean;
  error: string | null;
}

export function useTypeDiscovery(): TypeDiscoveryState {
  const [state, setState] = useState<TypeDiscoveryState>({
    typeInfos: [],
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

        // Convert typenames to TypeInfo objects with displayNames
        const typeInfos = createTypeInfoList(discoveredTypes);

        console.log('[useTypeDiscovery] Success:', {
          typesFound: typeInfos.length,
          duration: `${duration}ms`,
          sampleTypes: typeInfos.slice(0, 5).map(t => `${t.typename} -> ${t.displayName}`),
        });

        setState({
          typeInfos,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useTypeDiscovery] Failed:', errorMessage);

        setState({
          typeInfos: [],
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
