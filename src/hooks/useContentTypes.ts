import { useState, useEffect } from 'react';
import { executeContentTypesQuery, ContentType } from '../lib/graphql/client';

/**
 * State returned by the content types hook
 * @property contentTypes - Array of Nautobot content types from REST API
 * @property loading - Whether content types are being fetched
 * @property error - Error message if fetch failed, null otherwise
 */
export interface ContentTypesState {
  contentTypes: ContentType[];
  loading: boolean;
  error: string | null;
}

/**
 * React hook to load Nautobot content types on component mount
 * Content types are used to identify which GraphQL types correspond to primary Django models
 *
 * @returns Loading state, content types array, and error state
 */
export function useContentTypes(): ContentTypesState {
  const [state, setState] = useState<ContentTypesState>({
    contentTypes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchContentTypes() {
      console.log('[useContentTypes] Initiating content types fetch');

      try {
        const startTime = Date.now();
        const contentTypes = await executeContentTypesQuery();
        const duration = Date.now() - startTime;

        if (!mounted) return;

        console.log('[useContentTypes] Success:', {
          typesLoaded: contentTypes.length,
          duration: `${duration}ms`,
          sampleTypes: contentTypes.slice(0, 5).map(ct => `${ct.app_label}.${ct.model}`),
        });

        setState({
          contentTypes,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useContentTypes] Failed:', errorMessage);

        setState({
          contentTypes: [],
          loading: false,
          error: errorMessage,
        });
      }
    }

    fetchContentTypes();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
