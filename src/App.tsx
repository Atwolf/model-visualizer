import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Alert, CircularProgress } from '@mui/material';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { GraphQLTest } from './components/GraphQLTest';
import { buildGraphFromIntrospection, TransformOptions } from './lib/graph/graphqlTransformer';
import { GraphNode, GraphEdge } from './lib/graph/types';
import { useInitialTypeLoad } from './hooks/useInitialTypeLoad';
import { useTypeFetcher } from './hooks/useTypeFetcher';
import { useAppTypeFilter } from './hooks/useAppTypeFilter';
import { useTypeDiscovery } from './hooks/useTypeDiscovery';
import { IntrospectionType } from './lib/graphql/introspection';

function App() {
  // Load default types from GraphQL
  const { types: loadedTypes, loading: typesLoading, error: typeLoadError } = useInitialTypeLoad();

  // Type fetcher for dynamic loading
  const { fetchMultipleTypes } = useTypeFetcher();

  // Type discovery for app-based filtering
  const { types: discoveredTypes, loading: typesDiscoveryLoading, error: typesDiscoveryError } = useTypeDiscovery();

  // App-based type filtering
  const {
    config: filterConfig,
    typeFilter,
    addAdditionalType,
    removeAdditionalType,
  } = useAppTypeFilter();

  const [depth, setDepth] = useState(2);
  const [selectedRootTypes, setSelectedRootTypes] = useState<string[]>([]);
  const [typeData, setTypeData] = useState<Map<string, IntrospectionType>>(new Map());
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  // Get available root types from loaded types - these are the types users can select as graph starting points
  const rootTypes = Array.from(loadedTypes.keys());

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

  // Stable transform options - memoized to prevent unnecessary re-renders
  const transformOptions = useMemo<TransformOptions>(() => ({
    maxDepth: depth,
    includeScalars: false,
    showFieldNodes: false,
    typeFilter,
  }), [depth, typeFilter]);

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
        console.log('[App] Graph built with app filtering:', {
          nodesCreated: nodes.length,
          edgesCreated: edges.length,
        });
        setGraphData({ nodes, edges });
      }
    };

    buildGraph();

    // Cleanup: cancel if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [selectedRootTypes, typeData, transformOptions, fetchMultipleTypes]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <GraphQLTest />

      {/* Loading state */}
      {typesLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={24} />
          <Alert severity="info">Loading types from GraphQL schema...</Alert>
        </Box>
      )}

      {/* Error state */}
      {typeLoadError && !typesLoading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load types: {typeLoadError}
        </Alert>
      )}

      {/* Type discovery error */}
      {typesDiscoveryError && !typesDiscoveryLoading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Type discovery failed. Using default filter settings. Error: {typesDiscoveryError}
        </Alert>
      )}

      {/* Graph with integrated control panel */}
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          maxDepth={depth}
          depth={depth}
          onDepthChange={setDepth}
          rootTypes={rootTypes}
          selectedRootTypes={selectedRootTypes}
          onRootTypeSelect={handleRootTypeSelection}
          filterTypes={filterConfig.additionalTypes}
          discoveredTypes={discoveredTypes}
          onAddFilterType={addAdditionalType}
          onRemoveFilterType={removeAdditionalType}
        />
      </Box>
    </Container>
  );
}

export default App;
