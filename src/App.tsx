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
import { useContentTypes } from './hooks/useContentTypes';
import { IntrospectionType } from './lib/graphql/introspection';
import { createPrimaryModelChecker } from './lib/graph/contentTypeMapper';

function App() {
  // Load default types from GraphQL (only need loading states)
  const { loading: typesLoading, error: typeLoadError } = useInitialTypeLoad();

  // Type fetcher for dynamic loading
  const { fetchMultipleTypes } = useTypeFetcher();

  // Type discovery for app-based filtering
  const { types: discoveredTypes, loading: typesDiscoveryLoading, error: typesDiscoveryError } = useTypeDiscovery();

  // Content types for identifying primary models
  const { contentTypes, loading: contentTypesLoading, error: contentTypesError } = useContentTypes();

  // App-based type filtering
  const {
    config: filterConfig,
    typeFilter,
    addAdditionalType,
    removeAdditionalType,
  } = useAppTypeFilter();

  const [depth, setDepth] = useState(2);
  const [selectedRootType, setSelectedRootType] = useState<string | null>(null);
  const [typeData, setTypeData] = useState<Map<string, IntrospectionType>>(new Map());
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  // Create primary model checker from content types
  // Memoized to prevent unnecessary re-creation when content types haven't changed
  const primaryModelChecker = useMemo(() => {
    if (contentTypes.length === 0) {
      console.log('[App] No content types loaded - primaryModelChecker will return false for all types');
      return undefined; // No checker if content types not loaded
    }
    return createPrimaryModelChecker(contentTypes);
  }, [contentTypes]);

  // Filter discovered types to only include primary models for root type selection
  const primaryModelTypes = useMemo(() => {
    if (!primaryModelChecker) {
      return []; // No primary models available if checker not ready
    }
    return discoveredTypes.filter(typename => primaryModelChecker(typename));
  }, [discoveredTypes, primaryModelChecker]);

  // Handle root type selection - fetch introspection data for selected type
  const handleRootTypeSelection = async (newType: string | null) => {
    setSelectedRootType(newType);

    // Fetch introspection data for newly selected type
    if (newType) {
      const fetchedTypes = await fetchMultipleTypes([newType]);
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
    primaryModelChecker,
  }), [depth, typeFilter, primaryModelChecker]);

  // Build graph when root type selection or type data changes
  useEffect(() => {
    if (!selectedRootType) {
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
        [selectedRootType],
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
  }, [selectedRootType, typeData, transformOptions, fetchMultipleTypes]);

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

      {/* Content types loading */}
      {contentTypesLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={24} />
          <Alert severity="info">Loading content types for primary model detection...</Alert>
        </Box>
      )}

      {/* Content types error */}
      {contentTypesError && !contentTypesLoading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Content types failed to load. Primary model detection disabled. Error: {contentTypesError}
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
          rootTypes={primaryModelTypes}
          selectedRootType={selectedRootType}
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
