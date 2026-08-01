export interface GraphNode {
  id: string;
  title: string | null;
  url: string | null;
  resourceType: string;
  status: string;
  category: string | null;
  [key: string]: unknown;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: string;
  confidence: number | null;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
