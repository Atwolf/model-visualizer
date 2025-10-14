import { useMemo } from 'react';
import modelKinds from '../../model_kinds.json';

const PRIMARY_MODELS = new Set(
  (modelKinds?.data?.primary ?? []).map(entry => entry.toLowerCase())
);

const ROOT_PREFIXES = ['dcim.', 'circuits.', 'ipam.'] as const;

function toPrimaryCandidates(typename: string): string[] {
  if (!typename.endsWith('Type')) {
    return [];
  }

  const base = typename.slice(0, -4);
  if (!base) {
    return [];
  }

  const normalized = base.toLowerCase();
  return ROOT_PREFIXES.map(prefix => `${prefix}${normalized}`);
}

function isPrimaryRoot(typename: string): boolean {
  return toPrimaryCandidates(typename).some(candidate =>
    PRIMARY_MODELS.has(candidate)
  );
}

export interface GraphTypeOptions {
  filterTypes: string[];
  rootTypes: string[];
}

export function useGraphTypeOptions(discoveredTypes: string[]): GraphTypeOptions {
  return useMemo(() => {
    const filterTypes = discoveredTypes
      .filter(name => !name.startsWith('__') && name.endsWith('Type'))
      .sort((a, b) => a.localeCompare(b));

    const rootTypes = filterTypes.filter(isPrimaryRoot);

    return { filterTypes, rootTypes };
  }, [discoveredTypes]);
}
