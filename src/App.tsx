import { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Box, Alert, CircularProgress } from '@mui/material';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { GraphQLTest } from './components/GraphQLTest';
import { buildGraphFromIntrospection, TransformOptions } from './lib/graph/graphqlTransformer';
import { GraphNode, GraphEdge } from './lib/graph/types';
import { useTypeFetcher } from './hooks/useTypeFetcher';
import { useTypeDiscovery } from './hooks/useTypeDiscovery';
import { useGraphTypeOptions } from './hooks/useGraphTypeOptions';
import { IntrospectionType } from './lib/graphql/introspection';

function App() {
  const { fetchType, fetchMultipleTypes } = useTypeFetcher();
  const { types: discoveredTypes, loading: typesDiscoveryLoading, error: typesDiscoveryError } = useTypeDiscovery();
  const { filterTypes: availableFilterTypes, rootTypes } = useGraphTypeOptions(discoveredTypes);

  const [depth, setDepth] = useState(2);
  const [selectedRootType, setSelectedRootType] = useState<string | null>(null);
  const [selectedFilterTypes, setSelectedFilterTypes] = useState<string[]>([]);
  const [typeData, setTypeData] = useState<Map<string, IntrospectionType>>(new Map());
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: [],
  });
  const [loadingRootType, setLoadingRootType] = useState(false);
  const [rootLoadError, setRootLoadError] = useState<string | null>(null);

  const filterInitRef = useRef(false);
  const rootInitRef = useRef(false);

  useEffect(() => {
    if (availableFilterTypes.length === 0) {
      filterInitRef.current = false;
      setSelectedFilterTypes([]);
      return;
    }

    const availableSet = new Set(availableFilterTypes);

    setSelectedFilterTypes(prev => {
      const filtered = prev.filter(type => availableSet.has(type));

      if (!filterInitRef.current) {
        filterInitRef.current = true;
        return availableFilterTypes;
      }

      if (filtered.length !== prev.length) {
        return filtered;
      }

      return prev;
    });
  }, [availableFilterTypes]);

  useEffect(() => {
    if (rootTypes.length === 0) {
      rootInitRef.current = false;
      setSelectedRootType(null);
      return;
    }

    setSelectedRootType(prev => {
      if (prev && rootTypes.includes(prev)) {
        return prev;
      }

      if (!rootInitRef.current) {
        rootInitRef.current = true;
        return rootTypes[0];
      }

      return rootTypes[0];
    });
  }, [rootTypes]);

  useEffect(() => {
    if (!selectedRootType) {
      setTypeData(new Map());
      setGraphData({ nodes: [], edges: [] });
      setRootLoadError(null);
      setLoadingRootType(false);
      return;
    }

    let cancelled = false;
    setLoadingRootType(true);
    setRootLoadError(null);
    setTypeData(new Map());
    setGraphData({ nodes: [], edges: [] });

    const loadRootType = async () => {
      const result = await fetchType(selectedRootType);

      if (cancelled) {
        return;
      }

      if (!result.type) {
        setRootLoadError(result.error ?? `Failed to load ${selectedRootType}`);
        setLoadingRootType(false);
        return;
      }

      const map = new Map<string, IntrospectionType>();
      map.set(result.type.name, result.type);
      setTypeData(map);
      setLoadingRootType(false);
    };

    loadRootType().catch(error => {
      if (cancelled) {
        return;
      }
      setRootLoadError(error instanceof Error ? error.message : String(error));
      setLoadingRootType(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRootType, fetchType]);

  const filterPredicate = useMemo(() => {
    if (selectedFilterTypes.length === 0) {
      return () => false;
    }

    if (selectedFilterTypes.length === availableFilterTypes.length) {
      return undefined;
    }

    const allowed = new Set(selectedFilterTypes);
    return (typename: string) => allowed.has(typename);
  }, [selectedFilterTypes, availableFilterTypes]);

  const transformOptions = useMemo<TransformOptions>(() => {
    const options: TransformOptions = {
      maxDepth: depth,
      includeScalars: false,
      showFieldNodes: false,
    };

    if (filterPredicate) {
      options.typeFilter = filterPredicate;
    }

    return options;
  }, [depth, filterPredicate]);

  useEffect(() => {
    if (!selectedRootType) {
      setGraphData({ nodes: [], edges: [] });
      return;
    }

    if (!typeData.has(selectedRootType)) {
      return;
    }

    let cancelled = false;

    const buildGraph = async () => {
      const { nodes, edges } = await buildGraphFromIntrospection(
        [selectedRootType],
        typeData,
        transformOptions,
        fetchMultipleTypes
      );

      if (!cancelled) {
        setGraphData({ nodes, edges });
      }
    };

    buildGraph().catch(error => {
      if (!cancelled) {
        console.error('[App] Failed to build graph:', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRootType, typeData, transformOptions, fetchMultipleTypes]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <GraphQLTest />

      {typesDiscoveryLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={24} />
          <Alert severity="info">Discovering available GraphQL types...</Alert>
        </Box>
      )}

      {typesDiscoveryError && !typesDiscoveryLoading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Type discovery failed. Filtering options may be incomplete. Error: {typesDiscoveryError}
        </Alert>
      )}

      {loadingRootType && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={24} />
          <Alert severity="info">
            Loading introspection data for {selectedRootType ?? 'selected root type'}...
          </Alert>
        </Box>
      )}

      {rootLoadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {rootLoadError}
        </Alert>
      )}

      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          maxDepth={depth}
          depth={depth}
          onDepthChange={setDepth}
          rootTypes={rootTypes}
          selectedRootType={selectedRootType}
          onRootTypeSelect={setSelectedRootType}
          availableFilterTypes={availableFilterTypes}
          selectedFilterTypes={selectedFilterTypes}
          onFilterChange={setSelectedFilterTypes}
        />
      </Box>
    </Container>
  );
}

export default App;
