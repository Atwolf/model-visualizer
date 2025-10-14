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

The application uses distinct terms to differentiate between key concepts:

- **Root Types** (`rootTypes`, `selectedRootTypes`) - Types that can be selected as graph starting points. These are the entry nodes from which the graph visualization begins.
- **Filter Types** (`filterTypes`) - Additional types that control node visibility during graph traversal. These types are included in the graph even if they don't match the app-based filtering rules.
- **Primary Models** - GraphQL types that correspond to actual Nautobot Django models (e.g., Device, Interface, Manufacturer). These are identified by matching against content types from the Nautobot REST API. Primary models can have child nodes in the graph.
- **Utility Types** - GraphQL types that do not correspond to primary Nautobot models (e.g., Choices enums, nested configuration objects). These become terminal/leaf nodes in the graph with no outgoing edges.

### Core Data Flow

The application visualizes GraphQL schema relationships as an interactive graph:

1. **Type Discovery** (`useInitialTypeLoad`, `useTypeDiscovery`) - Fetches available GraphQL types from Nautobot introspection
2. **Content Types Loading** (`useContentTypes`) - Fetches Nautobot content types from REST API to identify primary Django models
3. **Primary Model Detection** (`contentTypeMapper.ts`) - Maps GraphQL types to Nautobot content types to distinguish primary models from utility types
4. **Type Filtering** (`useAppTypeFilter`) - Manages filter types by Nautobot application category (DCIM, IPAM, CIRCUITS)
5. **Graph Building** (`graphqlTransformer.ts`) - Transforms introspection data into graph nodes/edges using a three-pass algorithm with primary model checking
6. **Rendering** (`GraphCanvas.tsx`) - Renders the graph using ReactFlow with custom nodes and tree layout

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

### Primary Model Detection & Terminal Nodes

The application distinguishes between **primary models** (actual Nautobot Django models like Device, Interface) and **utility types** (support types like Choices, nested objects).

**Content Types API Integration**:
- Fetches content types from Nautobot REST API (`/extras/content-types/`)
- Filters by primary app labels: `dcim`, `ipam`, `circuits`
- Content types provide the authoritative list of Django models in Nautobot

**Type Name Mapping** (`contentTypeMapper.ts`):
- GraphQL type names follow the pattern `ModelNameType` (e.g., "DeviceType", "ManufacturerType")
- Content types use lowercase model names (e.g., "device", "manufacturer")
- Normalization removes "Type" suffix and converts to lowercase for matching

**Terminal Node Behavior**:
- Non-primary models become **terminal nodes** (leaves in the graph)
- Edges are only created **from** primary models
- This prevents graph traversal through utility types and focuses visualization on actual data models
- Example: If "StatusType" is not a primary model, it will appear as a leaf node with no outgoing edges

**Impact on Graph Structure**:
- Primary models can have children (edges are created from their relationship fields)
- Non-primary models cannot have children (edges from them are skipped)
- The `edgesSkippedNonPrimary` stat tracks how many edges were filtered

### State Management Pattern

The app uses a **hooks-based architecture** with specialized hooks:

- `useAppTypeFilter` - Manages app-based filtering state (DCIM/IPAM/CIRCUITS toggles + filter types)
- `useTypeFetcher` - Provides function to fetch introspection data for specific types
- `useTypeDiscovery` - Discovers all available types for autocomplete
- `useInitialTypeLoad` - Loads initial set of root types on app mount
- `useContentTypes` - Fetches Nautobot content types from REST API on mount for primary model detection

**Critical**: The `transformOptions` object in `App.tsx` is memoized with `useMemo` to prevent unnecessary graph rebuilds. Changes to `typeFilter` or `primaryModelChecker` will trigger a complete graph rebuild. The `primaryModelChecker` is derived from content types and memoized separately.

**State Flow**:
1. User selects root types from `rootTypes` → stored in `selectedRootTypes`
2. User adds filter types from `discoveredTypes` → stored in `filterTypes`
3. Graph builds from `selectedRootTypes`, respecting `filterTypes` during traversal

### Type Filtering System

Two filtering mechanisms work together:

1. **App-based filtering** (`appTypeFilter.ts`) - Categorizes types into Nautobot apps (DCIM, IPAM, CIRCUITS) and filters based on enabled apps + filter types. Filter types allow users to selectively include types that would otherwise be excluded.
2. **Depth filtering** (`depthFilter.ts`) - Filters graph nodes by depth level for visualization

The `typeFilter` function from `useAppTypeFilter` is passed into `graphqlTransformer` via `TransformOptions`, affecting which types are included during graph construction. This filter respects both app categories and the user's selected filter types.

### ReactFlow Integration

- Custom node component (`CustomNode.tsx`) renders type nodes with depth and typename metadata
- `GraphCanvas.tsx` manages ReactFlow state with `useNodesState` and `useEdgesState`
- Layout is calculated in `treeLayout.ts` using a horizontal tree algorithm
- Depth filtering happens in `GraphCanvas` before layout, controlled by maxDepth prop

### GraphQL Client Architecture

- `client.ts` - Low-level fetch wrapper with auth headers for both GraphQL and REST endpoints
  - `executeGraphQLQuery` - Executes GraphQL queries against `/api/graphql/`
  - `executeContentTypesQuery` - Fetches content types from REST API `/api/extras/content-types/`
- `introspection.ts` - GraphQL introspection query builder and type definitions
- `typeLoader.ts` - High-level API for loading types by name
- `contentTypeMapper.ts` - Maps GraphQL type names to Nautobot content types for primary model detection

The client automatically handles environment variables and switches between dev proxy and production direct connection. Content types are fetched from the REST API with app label filtering (dcim, ipam, circuits) to reduce result set.

## Key Constraints

- **Scalar filtering**: By default, scalar fields are filtered out - only object/interface relationships are visualized
- **Depth limits**: Graphs are depth-limited to prevent infinite recursion and performance issues
- **Type fetching**: The system can auto-fetch missing types during graph construction, but has a safety limit of 100 types per depth level
- **Memoization**: The `transformOptions` object must be stable to prevent graph rebuild loops
- **Primary model detection**: Relies on content types API being available. If content types fail to load, all types are treated as non-primary (terminal nodes). This is indicated by a warning in the UI.
- **Terminal node behavior**: Non-primary models become leaf nodes. Edges are only created FROM primary models, not from utility types.

## React State Updates and Rerendering

When modifying filtering logic or state management:

- Ensure memoization of filter functions and transform options with proper dependencies
- Changes to `typeFilter` or `primaryModelChecker` in `transformOptions` will trigger the `useEffect` in `App.tsx` which rebuilds the entire graph
- The `primaryModelChecker` is memoized in `App.tsx` with `contentTypes` as a dependency, so content types loading will trigger graph rebuild
- The graph rebuild happens in `buildGraphFromIntrospection` which is async and includes cleanup logic for cancelled operations
- Changes to `selectedRootTypes` will trigger graph rebuild from the new root nodes
- Changes to `filterTypes` (via `typeFilter`) will trigger graph rebuild with updated filtering rules
- Changes to `contentTypes` will update `primaryModelChecker`, which triggers graph rebuild with updated primary model detection
- `GraphCanvas` has its own `useEffect` that filters and layouts nodes when props change
