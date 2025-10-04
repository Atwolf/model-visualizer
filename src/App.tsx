import { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { GraphQLTest } from './components/GraphQLTest';
import { buildGraphFromRoots } from './lib/graph/builder';
import { GraphNode, GraphEdge } from './lib/graph/types';

// Mock data for development
const MOCK_TYPES = [
  'DeviceType',
  'InterfaceType',
  'CableType',
  'LocationType',
  'RackType',
  'IPAddressType',
  'PrefixType',
  'VLANType',
];

function App() {
  const [depth, setDepth] = useState(2);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

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

      <ControlPanel
        depth={depth}
        onDepthChange={setDepth}
        availableTypes={MOCK_TYPES}
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
