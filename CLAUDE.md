# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production (runs TypeScript compiler first)
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Environment Setup

This application requires environment variables to connect to a Nautobot GraphQL API:

```bash
# .env file (not committed to git)
VITE_NAUTOBOT_URL=http://your-nautobot-instance
VITE_NAUTOBOT_API_TOKEN=your-api-token
```

In development, the Vite dev server uses a proxy to avoid CORS issues (configured in `vite.config.ts`). The GraphQL client automatically switches between proxy mode (dev) and direct connection (production).

## Architecture Overview

### Terminology

The application uses distinct terms to differentiate between two key concepts:

- **Root Type** (`rootTypes`, `selectedRootType`) - GraphQL object types that can seed the visualization. Options are discovered from the schema and cross-referenced with `model_kinds.json`.
- **Filter Types** (`selectedFilterTypes`) - Allowlist of additional GraphQL types that should be traversed when expanding the graph.

### Core Data Flow

The application visualizes GraphQL schema relationships as an interactive graph:

1. **Type Discovery** (`useTypeDiscovery`) - Loads all object types from the Nautobot GraphQL schema.
   - `App.tsx` cross-references the discovered types with `model_kinds.json` (limited to `dcim.*`, `circuits.*`, `ipam.*`) to build the root type picker.
   - The same discovery result seeds the selectable filter list and default filter set.
2. **Graph Building** (`graphqlTransformer.ts`) - Transforms introspection data into graph nodes/edges using a multi-pass algorithm. Missing types are fetched lazily through `useTypeFetcher`.
3. **Rendering** (`GraphCanvas.tsx`) - Renders the graph using ReactFlow with custom nodes and tree layout.

### Graph Transformation Pipeline

The graph builder (`buildGraphFromIntrospection`) uses a **three-pass algorithm**:

**Pass 1**: Create all nodes breadth-first
- Iterates depth-by-depth from roots
- Auto-fetches missing type data via `TypeFetcher`
- Filters scalar fields to show only object relationships
- Tracks visited types to prevent duplicates

**Pass 2**: Create edges between existing nodes
- Iterates through all created nodes
- Creates edges only between nodes that exist
- Applies custom `typeFilter` to respect app-based filtering

**Pass 3**: Apply tree layout positioning
- Calculates x,y coordinates for ReactFlow

### State Management Pattern

The app uses a **hooks-based architecture** with specialized hooks:

- `useTypeFetcher` - Fetches and caches introspection data for individual types.
- `useTypeDiscovery` - Discovers all available object types (backed by `useAsyncResource` for loading state).
- `useGraphTypeOptions` - Derives the filter list and primary root candidates by combining discovered GraphQL types with `model_kinds.json`.
- `useAsyncResource` - Shared async state manager used by discovery and other potential loaders.

**Critical**: The `transformOptions` object in `App.tsx` is memoized with `useMemo` to prevent unnecessary graph rebuilds. Changes to `selectedFilterTypes` or `depth` will trigger a complete graph rebuild through the memoised `typeFilter` predicate.

**State Flow**:
1. `useTypeDiscovery` resolves available types. `App.tsx` maps them to root candidates using `model_kinds.json` and seeds default filter selections.
2. The user chooses a single root type (`selectedRootType`). `useTypeFetcher` introspects that type and stores it in `typeData`.
3. Graph construction runs with the current depth and filter selections, producing nodes/edges rendered by `GraphCanvas`.

### Type Filtering System

Two filtering mechanisms work together:

1. **Explicit type allowlist** - `selectedFilterTypes` is converted into a predicate passed through `TransformOptions.typeFilter`, restricting both edge creation and auto-fetch to the chosen GraphQL types.
2. **Depth filtering** (`depthFilter.ts`) - Filters graph nodes by depth level for visualization.

### ReactFlow Integration

- Custom node component (`CustomNode.tsx`) renders type nodes with depth and typename metadata
- `GraphCanvas.tsx` manages ReactFlow state with `useNodesState` and `useEdgesState`
- Layout is calculated in `treeLayout.ts` using a horizontal tree algorithm
- Depth filtering happens in `GraphCanvas` before layout, controlled by maxDepth prop

### GraphQL Client Architecture

- `client.ts` - Low-level fetch wrapper with auth headers
- `introspection.ts` - GraphQL introspection query builder and type definitions
- `useTypeFetcher` - Provides cached introspection queries when the graph needs additional schema information.

The client automatically handles environment variables and switches between dev proxy and production direct connection.

## Key Constraints

- **Scalar filtering**: By default, scalar fields are filtered out - only object/interface relationships are visualized
- **Depth limits**: Graphs are depth-limited to prevent infinite recursion and performance issues
- **Type fetching**: The system can auto-fetch missing types during graph construction, but has a safety limit of 100 types per depth level
- **Memoization**: The `transformOptions` object must be stable to prevent graph rebuild loops

## React State Updates and Rerendering

When modifying filtering logic or state management:

- Ensure memoization of filter functions and transform options with proper dependencies
- Changes to `selectedFilterTypes` (and the derived `typeFilter` predicate) trigger the `useEffect` in `App.tsx`, rebuilding the entire graph
- The graph rebuild happens in `buildGraphFromIntrospection` which is async and includes cleanup logic for cancelled operations
- Changes to `selectedRootType` will trigger graph rebuild from the new root node
- `GraphCanvas` has its own `useEffect` that filters and layouts nodes when props change
