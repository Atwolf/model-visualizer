import { useState, useCallback, useMemo } from 'react';
import {
  AppFilterConfig,
  NautobotApp,
  createDefaultAppFilterConfig,
  createAppTypeFilter,
  APP_CORE_TYPES,
} from '../lib/graph/appTypeFilter';

/**
 * Result returned by the app type filter hook
 * @property config - Current filter configuration
 * @property typeFilter - Filter function compatible with graphqlTransformer
 * @property toggleApp - Toggle an app on/off
 * @property addAdditionalType - Add a type to additional types list
 * @property removeAdditionalType - Remove a type from additional types list
 * @property setEnabled - Enable/disable the filter
 * @property reset - Reset to default configuration
 * @property getTypeCount - Get count of core and additional types
 */
export interface UseAppTypeFilterResult {
  config: AppFilterConfig;
  typeFilter: (typename: string) => boolean;
  toggleApp: (app: NautobotApp) => void;
  addAdditionalType: (typename: string) => void;
  removeAdditionalType: (typename: string) => void;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
  getTypeCount: () => { core: number; additional: number; total: number };
}

export function useAppTypeFilter(): UseAppTypeFilterResult {
  const [config, setConfig] = useState<AppFilterConfig>(
    createDefaultAppFilterConfig()
  );

  const typeFilter = useMemo(() => {
    return createAppTypeFilter(config);
  }, [config]);

  const toggleApp = useCallback((app: NautobotApp) => {
    setConfig(prev => {
      const newEnabled = !prev.enabledApps[app];
      console.log('[useAppTypeFilter] Toggling app:', app, '→', newEnabled);

      return {
        ...prev,
        enabledApps: {
          ...prev.enabledApps,
          [app]: newEnabled,
        },
      };
    });
  }, []);

  const addAdditionalType = useCallback((typename: string) => {
    setConfig(prev => {
      if (prev.additionalTypes.includes(typename)) {
        return prev;
      }

      return {
        ...prev,
        additionalTypes: [...prev.additionalTypes, typename],
      };
    });
  }, []);

  const removeAdditionalType = useCallback((typename: string) => {
    setConfig(prev => ({
      ...prev,
      additionalTypes: prev.additionalTypes.filter(t => t !== typename),
    }));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    console.log('[useAppTypeFilter] Setting enabled:', enabled);
    setConfig(prev => ({ ...prev, enabled }));
  }, []);

  const reset = useCallback(() => {
    console.log('[useAppTypeFilter] Resetting to defaults');
    setConfig(createDefaultAppFilterConfig());
  }, []);

  const getTypeCount = useCallback(() => {
    let coreCount = 0;
    for (const [app, enabled] of Object.entries(config.enabledApps)) {
      if (enabled) {
        coreCount += APP_CORE_TYPES[app as NautobotApp].length;
      }
    }

    const additionalCount = config.additionalTypes.length;
    const total = coreCount + additionalCount;

    return { core: coreCount, additional: additionalCount, total };
  }, [config]);

  return {
    config,
    typeFilter,
    toggleApp,
    addAdditionalType,
    removeAdditionalType,
    setEnabled,
    reset,
    getTypeCount,
  };
}
