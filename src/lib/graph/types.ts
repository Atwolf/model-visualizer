import { Node, Edge } from 'reactflow';

export interface GraphNode extends Node {
  data: {
    label: string;
    typename: string;
    depth: number;
    isRoot: boolean;
    fieldType?: 'scalar' | 'object' | 'list';
  };
}

export type GraphEdge = Edge;
