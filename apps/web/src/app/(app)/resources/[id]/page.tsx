'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, User, Calendar, Globe } from 'lucide-react';
import { apiGet, apiDelete } from '../../../../lib/api';
import { cn } from '../../../../lib/utils';
import type { ResourceDetail } from '../../../../features/resources/types';
import RelatedResources from '../../../../features/resources/RelatedResources';

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-slate-100 text-slate-600',
  FAILED: 'bg-red-100 text-red-700',
  DUPLICATE: 'bg-purple-100 text-purple-700',
};

function ScoreBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
        </div>
        <span className="text-sm font-medium shrink-0">{display}</span>
      </div>
    </div>
  );
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResource = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiGet<ResourceDetail>(`resources/${params.id}`);
      if (res.success && res.data) {
        setResource(res.data);
      } else {
        setError(res.error?.message ?? 'Not found');
      }
    } catch {
      setError('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (!resource) return;
    if (resource.status !== 'PROCESSING' && resource.status !== 'PENDING') return;

    const timer = setInterval(() => {
      fetchResource(true);
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.status]);

  const handleDelete = async () => {
    if (!confirm('Delete this resource?')) return;
    const res = await apiDelete(`resources/${params.id}`);
    if (res.success) router.push('/resources');
  };

  if (loading && !resource) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/4" />
        <div className="h-8 bg-secondary rounded w-2/3" />
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-32 bg-secondary rounded" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive">{error ?? 'Resource not found'}</p>
        <button onClick={() => router.push('/resources')} className="text-sm text-primary underline mt-2">
          Back to resources
        </button>
      </div>
    );
  }

  const ai = resource.aiAnalysis;
  const meta = resource.metadata as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold truncate">{resource.title ?? 'Untitled'}</h1>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0',
                  statusStyles[resource.status] ?? 'bg-slate-100 text-slate-600',
                )}
              >
                {resource.status}
              </span>
            </div>
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                {getDomain(resource.url)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 text-sm text-destructive hover:underline"
          >
            Delete
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
          <span>Saved {new Date(resource.savedAt).toLocaleDateString()}</span>
          <span className="capitalize">{resource.resourceType.replace(/_/g, ' ')}</span>
          {typeof meta?.siteName === 'string' && meta.siteName && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" /> {meta.siteName}
            </span>
          )}
          {typeof meta?.author === 'string' && meta.author && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" /> {meta.author}
            </span>
          )}
          {typeof meta?.publishDate === 'string' && meta.publishDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(meta.publishDate).toLocaleDateString()}
            </span>
          )}
          {typeof meta?.language === 'string' && meta.language && <span>{meta.language}</span>}
        </div>

        {(resource.projects.length > 0 || resource.collections.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resource.projects.map(({ project }) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border hover:border-primary/50"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color ?? '#64748b' }}
                />
                {project.name}
              </Link>
            ))}
            {resource.collections.map(({ collection }) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-violet-700 bg-violet-50 border border-violet-200 hover:border-violet-400"
              >
                {collection.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {resource.status === 'PROCESSING' || resource.status === 'PENDING' ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {resource.status === 'PROCESSING'
              ? 'AI analysis in progress…'
              : 'Waiting to be processed…'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">This page updates automatically.</p>
        </div>
      ) : !ai ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No AI analysis available for this resource.
        </p>
      ) : (
        <div className="space-y-5">
          {ai.summary && (
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Summary</h2>
              <p className="text-sm leading-relaxed">{ai.summary}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {ai.category && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Category</p>
                <p className="text-sm font-medium">
                  {ai.category}
                  {ai.subcategory ? ` / ${ai.subcategory}` : ''}
                </p>
              </div>
            )}
            {ai.importance && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Importance</p>
                <p className="text-sm font-medium">{ai.importance}/10</p>
              </div>
            )}
            {ai.readingTime && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Reading time</p>
                <p className="text-sm font-medium">{ai.readingTime} min</p>
              </div>
            )}
            {ai.difficulty && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Difficulty</p>
                <p className="text-sm font-medium capitalize">{ai.difficulty}</p>
              </div>
            )}
            {ai.model && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Model</p>
                <p className="text-sm font-medium">{ai.model}</p>
              </div>
            )}
          </div>

          {(ai.qualityScore != null || ai.noveltyScore != null || ai.confidence != null) && (
            <div className="grid sm:grid-cols-3 gap-3">
              {ai.qualityScore != null && (
                <ScoreBar
                  label="Quality"
                  value={ai.qualityScore}
                  display={`${Math.round(ai.qualityScore * 100)}%`}
                />
              )}
              {ai.noveltyScore != null && (
                <ScoreBar
                  label="Novelty"
                  value={ai.noveltyScore}
                  display={`${Math.round(ai.noveltyScore * 100)}%`}
                />
              )}
              {ai.confidence != null && (
                <ScoreBar
                  label="Confidence"
                  value={ai.confidence}
                  display={`${Math.round(ai.confidence * 100)}%`}
                />
              )}
            </div>
          )}

          {ai.tags.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {ai.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ai.topics.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Topics</h2>
              <div className="flex flex-wrap gap-1.5">
                {ai.topics.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 border border-input rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ai.keyConcepts.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Key Concepts</h2>
              <div className="flex flex-wrap gap-1.5">
                {ai.keyConcepts.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ai.entities && ai.entities.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Entities</h2>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {ai.entities.map((e, i) => (
                  <div
                    key={`${e.name}-${i}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm font-medium truncate">{e.name}</span>
                    <span className="text-xs text-muted-foreground capitalize shrink-0 ml-2">
                      {e.type}
                      {e.confidence != null && ` · ${Math.round(e.confidence * 100)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resource.content?.cleanText && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Content</h2>
              <div className="rounded-lg border p-4">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                  {resource.content.cleanText}
                </pre>
              </div>
            </div>
          )}

          {ai.reasoning && !ai.reasoning.startsWith('FAILED') && (
            <details className="rounded-lg border p-4">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer">
                AI reasoning
              </summary>
              <p className="text-sm text-muted-foreground mt-2">{ai.reasoning}</p>
            </details>
          )}

          {ai.reasoning?.startsWith('FAILED') && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Analysis failed: {ai.reasoning.replace('FAILED: ', '')}
            </div>
          )}
        </div>
      )}

      {resource.status === 'COMPLETED' && <RelatedResources resourceId={resource.id} />}
    </div>
  );
}
