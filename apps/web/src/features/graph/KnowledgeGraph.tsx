'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import type { SimulationNodeDatum } from 'd3-force';
import '@xyflow/react/dist/style.css';
import { ExternalLink, Maximize2, X } from 'lucide-react';
import { apiGet } from '../../lib/api';
import type { GraphData, GraphEdge, GraphNode } from './types';
import type { ResourceDetail } from '../resources/types';

const CATEGORY_COLORS = [
  '#8b5cf6',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#6366f1',
];

const EDGE_COLORS: Record<string, string> = {
  similar: '#8b5cf6',
  references: '#0ea5e9',
  prerequisite: '#f59e0b',
  continues: '#10b981',
  contradicts: '#ef4444',
  alternative: '#06b6d4',
  same_topic: '#f97316',
  same_author: '#ec4899',
  same_project: '#64748b',
  duplicate: '#d946ef',
  version_update: '#84cc16',
};

function colorFor(category: string | null): string {
  if (!category) return '#64748b';
  let h = 0;
  for (const c of category) h = (h * 31 + c.charCodeAt(0)) % 997;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length] ?? '#64748b';
}

function edgeColor(type: string): string {
  return EDGE_COLORS[type] ?? '#94a3b8';
}

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

type ResourceNodeData = GraphNode;
type LayoutNode = GraphNode & SimulationNodeDatum;

function ResourceNode({ data }: NodeProps<Node<ResourceNodeData>>) {
  const accent = colorFor(data.category);
  return (
    <div
      className="w-48 rounded-lg border bg-background shadow-sm px-3 py-2"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <p className="text-[13px] font-medium leading-snug line-clamp-2">{data.title ?? 'Untitled'}</p>
      {data.category && (
        <p className="text-[10px] mt-1 inline-flex items-center gap-1 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          {data.category}
        </p>
      )}
    </div>
  );
}

const nodeTypes = { resource: ResourceNode };

export function KnowledgeGraph() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get('focus') ?? undefined;

  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ResourceDetail | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ResourceNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setGraph(null);
    setSelected(null);
    setSelectedDetail(null);
    setHiddenTypes(new Set());

    apiGet<GraphData>('graph', { focusId }).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setGraph(res.data);
      } else {
        setError(res.error?.message ?? 'Failed to load graph');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [focusId]);

  useEffect(() => {
    if (!graph) return;

    const visibleEdges = graph.edges.filter((e) => !hiddenTypes.has(e.type));
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const layoutEdges = visibleEdges
      .filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
      .map((e) => ({ ...e, source: e.sourceId, target: e.targetId }));

    const sim = forceSimulation<LayoutNode>(
      graph.nodes.map((n) => ({ ...n })),
    )
      .force(
        'link',
        forceLink<LayoutNode, GraphEdge & { source: string; target: string }>(layoutEdges)
          .id((d) => d.id)
          .distance(150)
          .strength(0.7),
      )
      .force('charge', forceManyBody<LayoutNode>().strength(-380))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<LayoutNode>().radius(60));
    sim.stop();
    sim.tick(300);

    const pos = new Map(sim.nodes().map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));

    setNodes(
      graph.nodes.map((n) => ({
        id: n.id,
        type: 'resource' as const,
        position: pos.get(n.id) ?? { x: 0, y: 0 },
        data: n,
      })),
    );
    setEdges(
      visibleEdges
        .filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
        .map((e) => ({
          id: `${e.sourceId}-${e.targetId}-${e.type}`,
          source: e.sourceId,
          target: e.targetId,
          label: `${e.type}${e.confidence != null ? ` · ${Math.round(e.confidence * 100)}%` : ''}`,
          labelStyle: { fontSize: 9, fill: edgeColor(e.type) },
          labelBgStyle: { fill: 'rgba(255,255,255,0.85)', fillOpacity: 1 },
          labelBgPadding: [3, 2] as [number, number],
          labelBgBorderRadius: 4,
          style: { stroke: edgeColor(e.type), strokeWidth: 1.4 },
        })),
    );
  }, [graph, hiddenTypes, setNodes, setEdges]);

  useEffect(() => {
    if (!selected) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    apiGet<ResourceDetail>(`resources/${selected}`).then((res) => {
      if (!cancelled && res.success && res.data) setSelectedDetail(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const types = useMemo(() => {
    if (!graph) return [];
    const set = new Set<string>();
    for (const e of graph.edges) set.add(e.type);
    return [...set].sort();
  }, [graph]);

  const neighbors = useMemo(() => {
    if (!graph || !selected) return [];
    const ids = new Set<string>();
    for (const e of graph.edges) {
      if (e.sourceId === selected) ids.add(e.targetId);
      if (e.targetId === selected) ids.add(e.sourceId);
    }
    return graph.nodes.filter((n) => ids.has(n.id));
  }, [graph, selected]);

  const selectedNode = graph?.nodes.find((n) => n.id === selected) ?? null;

  if (loading) {
    return (
      <div className="rounded-lg border h-[calc(100vh-10rem)] animate-pulse bg-secondary/30" />
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="rounded-lg border text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-1">No knowledge graph yet</p>
        <p className="text-sm">
          Save a few resources and the system will link related ones automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => {
          const active = !hiddenTypes.has(t);
          return (
            <button
              key={t}
              onClick={() =>
                setHiddenTypes((prev) => {
                  const next = new Set(prev);
                  if (next.has(t)) next.delete(t);
                  else next.add(t);
                  return next;
                })
              }
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
                active ? 'bg-secondary' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: edgeColor(t) }} />
              {t}
              <span className="text-muted-foreground">
                {graph.edges.filter((e) => e.type === t).length}
              </span>
            </button>
          );
        })}
        {graph.nodes.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {nodes.length} resources · {edges.length} links
          </span>
        )}
      </div>

      <div className="relative rounded-lg border overflow-hidden h-[calc(100vh-14rem)]">
        <ReactFlow<Node<ResourceNodeData>>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelected(node.id)}
          onPaneClick={() => setSelected(null)}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(n) =>
              colorFor(((n.data as unknown) as ResourceNodeData | undefined)?.category ?? null)
            }
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute top-3 right-3 w-72 rounded-lg border bg-background shadow-lg p-4 space-y-3 z-10">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-snug line-clamp-2">
                {selectedNode.title ?? 'Untitled'}
              </p>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedNode.url && (
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{getDomain(selectedNode.url)}</span>
              </a>
            )}
            {selectedDetail?.aiAnalysis?.summary && (
              <p className="text-xs text-muted-foreground line-clamp-4">
                {selectedDetail.aiAnalysis.summary}
              </p>
            )}
            {selectedDetail?.aiAnalysis?.tags && selectedDetail.aiAnalysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedDetail.aiAnalysis.tags.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {neighbors.length > 0 && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  Directly related ({neighbors.length})
                </p>
                <ul className="space-y-1">
                  {neighbors.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => setSelected(n.id)}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground truncate"
                      >
                        {n.title ?? 'Untitled'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Link
                href={`/resources/${selectedNode.id}`}
                className="flex-1 text-center rounded-md bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 hover:bg-primary/90"
              >
                Open resource
              </Link>
              <button
                onClick={() => router.push(`/graph?focus=${selectedNode.id}`)}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-secondary/50"
                title="Re-center graph on this resource"
              >
                <Maximize2 className="h-3 w-3" />
                Focus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
