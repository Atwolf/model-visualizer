import { useState, useEffect } from 'react';
import { Container, Box, Alert, CircularProgress } from '@mui/material';
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { GraphQLTest } from './components/GraphQLTest';
import { buildGraphFromRoots } from './lib/graph/builder';
import { GraphNode, GraphEdge } from './lib/graph/types';
import { useInitialTypeLoad } from './hooks/useInitialTypeLoad';

function App() {
  // Load default types from GraphQL
  const { types: loadedTypes, loading: typesLoading, error: typeLoadError } = useInitialTypeLoad();

  const [depth, setDepth] = useState(2);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  // Get available types from loaded types
  const availableTypes = Array.from(loadedTypes.keys());

  // Build graph when selections change
  useEffect(() => {
    console.log('Graph rebuild:', { roots: selectedTypes, depth });

    if (selectedTypes.length === 0) {
      setGraphData({ nodes: [], edges: [] });
      return;
    }

    const { nodes, edges } = buildGraphFromRoots(selectedTypes, depth);
    setGraphData({ nodes, edges });
  }, [selectedTypes, depth]);

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
        onTypeSelect={setSelectedTypes}
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
