/**
 * Application-wide default configuration values
 */

// Default graph visualization settings
export const DEFAULT_ROOT_TYPE = 'DeviceType';
export const DEFAULT_DEPTH = 3;

// Initial filter types - typenames that should be pre-selected
export const INITIAL_FILTER_TYPES = [
  'VLANType',
  'VRFType',
  'IPAddressType',
  'CircuitType',
  'CircuitTerminationType',
  'ProviderType',
  'ProviderNetworkType',
  'DeviceType',
  'InterfaceType',
  'StatusType',
  'RackType',
  'LocationType',
  'IPAddressFamilyType',
  'PlatformType',
] as const;

// Nautobot app ordering for UI display
export const APP_ORDER = { DCIM: 0, IPAM: 1, CIRCUITS: 2 } as const;
