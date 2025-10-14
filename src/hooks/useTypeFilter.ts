import { useState, useCallback } from 'react';
import {
  TypeFilterConfig,
  isTypeAllowed as isTypeAllowedFn,
  createDefaultFilterConfig,
} from '../lib/graph/typeFilter';

/**
 * Return type for the useTypeFilter hook
 */
export interface UseTypeFilterResult {
  /** Current filter configuration */
  config: TypeFilterConfig;
  /** Check if a typename is allowed by the current filter */
  isTypeAllowed: (typename: string) => boolean;
  /** Add a new pattern to the include list */
  addPattern: (pattern: string) => void;
  /** Remove a pattern from the include list */
  removePattern: (pattern: string) => void;
  /** Enable or disable filtering */
  setEnabled: (enabled: boolean) => void;
  /** Reset filter to default configuration */
  reset: () => void;
}

/**
 * React hook for managing type filtering
 *
 * Provides a stateful filter configuration and methods to modify it.
 * The filter determines which GraphQL types are shown in the graph.
 *
 * @returns Filter state and control methods
 *
 * @example
 * ```tsx
 * const { config, isTypeAllowed, addPattern } = useTypeFilter();
 *
 * // Check if type should be shown
 * if (isTypeAllowed('DeviceType')) {
 *   // Include in graph
 * }
 *
 * // Add custom pattern
 * addPattern('Tag*');
 * ```
 */
export function useTypeFilter(): UseTypeFilterResult {
  const [config, setConfig] = useState<TypeFilterConfig>(
    createDefaultFilterConfig()
  );

  const isTypeAllowed = useCallback(
    (typename: string) => isTypeAllowedFn(typename, config),
    [config]
  );

  const addPattern = useCallback((pattern: string) => {
    setConfig(prev => ({
      ...prev,
      includePatterns: [...prev.includePatterns, pattern],
    }));
  }, []);

  const removePattern = useCallback((pattern: string) => {
    setConfig(prev => ({
      ...prev,
      includePatterns: prev.includePatterns.filter(p => p !== pattern),
    }));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, enabled }));
  }, []);

  const reset = useCallback(() => {
    setConfig(createDefaultFilterConfig());
  }, []);

  return {
    config,
    isTypeAllowed,
    addPattern,
    removePattern,
    setEnabled,
    reset,
  };
}
