/**
 * Nautobot application categories for type filtering
 */
export type NautobotApp = 'DCIM' | 'IPAM' | 'CIRCUITS';

/**
 * Configuration for app-based type filtering
 * @property enabledApps - Map of Nautobot apps to their enabled state
 * @property additionalTypes - Additional types added via autocomplete beyond core types
 * @property enabled - Whether filtering is active
 */
export interface AppFilterConfig {
  enabledApps: Record<NautobotApp, boolean>;
  additionalTypes: string[];
  enabled: boolean;
}

export const APP_CORE_TYPES: Record<NautobotApp, string[]> = {
  DCIM: [
    'DeviceType',
    'InterfaceType',
    'CableType',
    'LocationType',
    'RackType',
  ],
  IPAM: [
    'IPAddressType',
    'PrefixType',
    'VLANType',
    'VRFType',
  ],
  CIRCUITS: [
    'CircuitType',
    'ProviderType',
    'CircuitTerminationType',
  ],
};

/**
 * Get all core types from all apps combined
 * @returns Array of all core type names
 */
export function getAllCoreTypes(): string[] {
  return [
    ...APP_CORE_TYPES.DCIM,
    ...APP_CORE_TYPES.IPAM,
    ...APP_CORE_TYPES.CIRCUITS,
  ];
}

export function categorizeType(typename: string): NautobotApp {
  const lower = typename.toLowerCase();

  if (
    lower.includes('ipaddress') ||
    lower.includes('prefix') ||
    lower.includes('vlan') ||
    lower.includes('vrf') ||
    lower.includes('namespace')
  ) {
    return 'IPAM';
  }

  if (
    lower.includes('circuit') ||
    lower.includes('provider')
  ) {
    return 'CIRCUITS';
  }

  return 'DCIM';
}

export function categorizeAllTypes(
  allTypes: string[]
): Record<NautobotApp, string[]> {
  console.log('[categorizeAllTypes] Categorizing', allTypes.length, 'types');

  const categorized: Record<NautobotApp, string[]> = {
    DCIM: [],
    IPAM: [],
    CIRCUITS: [],
  };

  for (const typename of allTypes) {
    const app = categorizeType(typename);
    categorized[app].push(typename);
  }

  console.log('[categorizeAllTypes] Results:', {
    DCIM: categorized.DCIM.length,
    IPAM: categorized.IPAM.length,
    CIRCUITS: categorized.CIRCUITS.length,
    sampleDCIM: categorized.DCIM.slice(0, 5),
    sampleIPAM: categorized.IPAM.slice(0, 5),
    sampleCIRCUITS: categorized.CIRCUITS.slice(0, 5),
  });

  return categorized;
}

export function createAppTypeFilter(
  config: AppFilterConfig
): (typename: string) => boolean {
  return (typename: string): boolean => {
    if (!config.enabled) {
      return true;
    }

    if (config.additionalTypes.includes(typename)) {
      return true;
    }

    for (const [app, enabled] of Object.entries(config.enabledApps)) {
      if (enabled && APP_CORE_TYPES[app as NautobotApp].includes(typename)) {
        return true;
      }
    }

    return false;
  };
}

export function createDefaultAppFilterConfig(): AppFilterConfig {
  return {
    enabledApps: {
      DCIM: true,
      IPAM: true,
      CIRCUITS: true,
    },
    additionalTypes: getAllCoreTypes(),
    enabled: true,
  };
}
