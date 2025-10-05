import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Alert, CircularProgress } from '@mui/material';
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { GraphQLTest } from './components/GraphQLTest';
import { buildGraphFromIntrospection, TransformOptions } from './lib/graph/graphqlTransformer';
import { GraphNode, GraphEdge } from './lib/graph/types';
import { useInitialTypeLoad } from './hooks/useInitialTypeLoad';
import { useTypeFetcher } from './hooks/useTypeFetcher';
import { IntrospectionType } from './lib/graphql/introspection';

function App() {
  // Load default types from GraphQL
  const { types: loadedTypes, loading: typesLoading, error: typeLoadError } = useInitialTypeLoad();

  // Type fetcher for dynamic loading
  const { fetchMultipleTypes } = useTypeFetcher();

  const [depth, setDepth] = useState(2);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeData, setTypeData] = useState<Map<string, IntrospectionType>>(new Map());
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  // Get available types from loaded types
  const availableTypes = Array.from(loadedTypes.keys());

  // Handle type selection - fetch introspection data for selected types
  const handleTypeSelection = async (newTypes: string[]) => {
    setSelectedTypes(newTypes);

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
    includeScalars: false, // Filter out scalar fields by default
    showFieldNodes: false,
  }), [depth]);

  // Build graph when selections or type data changes
  useEffect(() => {
    if (selectedTypes.length === 0) {
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
        selectedTypes,
        typeData,
        transformOptions,
        fetchMultipleTypes // Enable auto-fetch of referenced types
      );

      if (!cancelled) {
        setGraphData({ nodes, edges });
      }
    };

    buildGraph();

    // Cleanup: cancel if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [selectedTypes, typeData, transformOptions, fetchMultipleTypes]);

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

      {/* Main controls - disabled while loading */}
      <ControlPanel
        depth={depth}
        onDepthChange={setDepth}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onTypeSelect={handleTypeSelection}
      />

      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          maxDepth={depth}
        />
      </Box>
    </Container>
  );
}

export default App;
