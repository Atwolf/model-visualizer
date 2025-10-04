import { Node, Edge } from 'reactflow';

export interface GraphNode extends Node {
  data: {
    label: string;
    depth: number;
    isRoot: boolean;
  };
}

export type GraphEdge = Edge;
