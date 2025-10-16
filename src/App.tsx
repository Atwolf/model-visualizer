import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { buildGraphFromIntrospection, TransformOptions } from './lib/graph/graphqlTransformer';
import { GraphNode, GraphEdge } from './lib/graph/types';
import { useTypeFetcher } from './hooks/useTypeFetcher';
import { useTypeDiscovery } from './hooks/useTypeDiscovery';
import { IntrospectionType } from './lib/graphql/introspection';
import { filterPrimaryModels } from './lib/graph/primaryModelFilter';
import { extractTypenames } from './lib/graph/typeUtils';
import { parseForeignKeysFromModule } from './utils/fkParser';
import { buildNameMapper } from './utils/nameMapper';
import { buildFKLookupMap } from './utils/fkLookup';
import sqlExportData from './data/sql_export.json';

function App() {
  // Type fetcher for dynamic loading
  const { fetchMultipleTypes } = useTypeFetcher();

  // Type discovery - get ALL available types from GraphQL schema with display names
  const { typeInfos: discoveredTypeInfos, loading: typesDiscoveryLoading, error: typesDiscoveryError } = useTypeDiscovery();

  // Filter discovered types to only primary models - this becomes our single source of truth
  const primaryModelTypeInfos = useMemo(() => {
    // Extract typenames for filtering
    const allTypenames = extractTypenames(discoveredTypeInfos);
    const primaryTypenames = filterPrimaryModels(allTypenames);

    // Filter TypeInfo objects to only include primary models
    const filtered = discoveredTypeInfos.filter(typeInfo =>
      primaryTypenames.includes(typeInfo.typename)
    );

    console.log('[App] Filtered primary models:', {
      totalDiscovered: discoveredTypeInfos.length,
      primaryModels: filtered.length,
      sampleDisplay: filtered.slice(0, 5).map(t => `${t.typename} -> ${t.displayName}`),
    });
    return filtered;
  }, [discoveredTypeInfos]);

  // Initial filter types - typenames that should be pre-selected
  const INITIAL_FILTER_TYPES = [
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
  ];

  const [depth, setDepth] = useState(2);
  const [selectedRootTypes, setSelectedRootTypes] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [showFKOnly, setShowFKOnly] = useState(false);
  const [typeData, setTypeData] = useState<Map<string, IntrospectionType>>(new Map());
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  // Use primaryModelTypeInfos as both rootTypes and available filter types
  const rootTypeInfos = primaryModelTypeInfos;

  // Set initial filter types once types are discovered
  useEffect(() => {
    if (primaryModelTypeInfos.length > 0 && filterTypes.length === 0) {
      const primaryTypenames = extractTypenames(primaryModelTypeInfos);
      const validInitialFilters = INITIAL_FILTER_TYPES.filter(typename =>
        primaryTypenames.includes(typename)
      );

      console.log('[App] Setting initial filter types:', {
        requested: INITIAL_FILTER_TYPES.length,
        valid: validInitialFilters.length,
        filters: validInitialFilters,
      });

      setFilterTypes(validInitialFilters);
    }
  }, [primaryModelTypeInfos]);

  // Handle root type selection - fetch introspection data for selected types
  const handleRootTypeSelection = async (newTypes: string[]) => {
    setSelectedRootTypes(newTypes);

    // Fetch introspection data for newly selected types
    if (newTypes.length > 0) {
      const fetchedTypes = await fetchMultipleTypes(newTypes);
      setTypeData(fetchedTypes);
    } else {
      setTypeData(new Map());
    }
  };

  // Type filter function - include types that are in the filterTypes list
  const typeFilter = useCallback((typename: string): boolean => {
    // If no filter types selected, include all primary models
    if (filterTypes.length === 0) {
      return true;
    }
    // Otherwise, only include types in the filter list
    return filterTypes.includes(typename);
  }, [filterTypes]);

  // Handlers for filter type management
  const handleAddFilterType = useCallback((typename: string) => {
    setFilterTypes(prev => {
      if (prev.includes(typename)) {
        return prev;
      }
      return [...prev, typename];
    });
  }, []);

  const handleRemoveFilterType = useCallback((typename: string) => {
    setFilterTypes(prev => prev.filter(t => t !== typename));
  }, []);

  // FK System Integration: Build FK lookup map from type discovery
  const fkLookup = useMemo(() => {
    try {
      console.log('[App] Building FK lookup system...');

      // Step 1: Parse FK data from sql_export.json
      const foreignKeys = parseForeignKeysFromModule(sqlExportData);
      console.log(`[App] Parsed ${foreignKeys.length} foreign keys`);

      // Step 2: Build name mapper from discovered types
      const allTypenames = extractTypenames(discoveredTypeInfos);
      if (allTypenames.length === 0) {
        console.warn('[App] No types available for name mapping');
        return null;
      }

      const nameMapper = buildNameMapper(allTypenames);
      console.log(`[App] Built name mapper with ${nameMapper.getAllTypes().length} types`);

      // Step 3: Build FK lookup map
      const lookup = buildFKLookupMap(foreignKeys, nameMapper);
      console.log(`[App] Built FK lookup with ${lookup.size} entries`);

      return lookup;
    } catch (error) {
      console.error('[App] Failed to build FK lookup:', error);
      return null;
    }
  }, [discoveredTypeInfos]);

  // Stable transform options - memoized to prevent unnecessary re-renders
  const transformOptions = useMemo<TransformOptions>(() => ({
    maxDepth: depth,
    includeScalars: false,
    showFieldNodes: false,
    typeFilter,
    fkLookup, // Include FK lookup for edge enhancement
  }), [depth, typeFilter, fkLookup]);

  // Build graph when root type selections or type data changes
  useEffect(() => {
    if (selectedRootTypes.length === 0) {
      setGraphData({ nodes: [], edges: [] });
      return;
    }

    // Wait for type data to be loaded
    if (typeData.size === 0) {
      return;
    }

    let cancelled = false;

    // Build graph from introspection data with auto-fetch
    const buildGraph = async () => {
      const { nodes, edges } = await buildGraphFromIntrospection(
        selectedRootTypes,
        typeData,
        transformOptions,
        fetchMultipleTypes
      );

      if (!cancelled) {
        console.log('[App] Graph built:', {
          nodesCreated: nodes.length,
          edgesCreated: edges.length,
          filterTypesActive: filterTypes.length,
        });
        setGraphData({ nodes, edges });
      }
    };

    buildGraph();

    // Cleanup: cancel if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [selectedRootTypes, typeData, transformOptions, fetchMultipleTypes, filterTypes.length]);

  return (
    <>
      {/* Loading state - overlay on top */}
      {typesDiscoveryLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          <CircularProgress size={24} />
          <Alert severity="info" sx={{ m: 0 }}>
            Discovering types from GraphQL schema...
          </Alert>
        </Box>
      )}

      {/* Type discovery error - overlay on top */}
      {typesDiscoveryError && !typesDiscoveryLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 2000,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          <Alert severity="error">
            Failed to discover types: {typesDiscoveryError}
          </Alert>
        </Box>
      )}

      {/* Graph fills entire viewport */}
      <GraphCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
        maxDepth={depth}
        depth={depth}
        onDepthChange={setDepth}
        rootTypeInfos={rootTypeInfos}
        selectedRootTypes={selectedRootTypes}
        onRootTypeSelect={handleRootTypeSelection}
        filterTypes={filterTypes}
        discoveredTypeInfos={primaryModelTypeInfos}
        onAddFilterType={handleAddFilterType}
        onRemoveFilterType={handleRemoveFilterType}
        showFKOnly={showFKOnly}
        onToggleFKOnly={setShowFKOnly}
      />
    </>
  );
}

export default App;
