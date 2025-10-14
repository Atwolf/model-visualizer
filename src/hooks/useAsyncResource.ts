import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../lib/utils/errors';

export interface UseAsyncResourceOptions<T> {
  /** Provides the default value when loading or on failure. */
  initialValue: () => T;
  /** Automatically trigger the loader when the hook mounts. */
  autoLoad?: boolean;
}

export interface AsyncResourceState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<T>;
}

/**
 * Generic hook for managing async resources with loading and error state.
 * Handles component unmounts and ensures the state is reset to the initial value on failure.
 *
 * @param loader - Async function that resolves the desired data.
 * @param options - Control auto loading and initial defaults.
 */
export function useAsyncResource<T>(
  loader: () => Promise<T>,
  { initialValue, autoLoad = true }: UseAsyncResourceOptions<T>
): AsyncResourceState<T> {
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const getInitialValue = useCallback(() => initialValueRef.current(), []);

  const [data, setData] = useState<T>(() => getInitialValue());
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loader();

      if (isMounted.current) {
        setData(result);
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err);

      if (isMounted.current) {
        setError(message);
        setData(getInitialValue());
      }

      return getInitialValue();
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [getInitialValue, loader]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    reload();
  }, [autoLoad, reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
