'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiDelete } from '../../../../lib/api';
import type { ResourceDetail } from '../../../../features/resources/types';

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
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
    })();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Delete this resource?')) return;
    const res = await apiDelete(`resources/${params.id}`);
    if (res.success) router.push('/resources');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{resource.title ?? 'Untitled'}</h1>
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                {getDomain(resource.url)}
                <span className="text-xs">↗</span>
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
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          <span>Saved {new Date(resource.savedAt).toLocaleDateString()}</span>
          <span className="capitalize">{resource.resourceType.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {ai && (
        <div className="space-y-4">
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
                <p className="text-sm font-medium">{ai.category}</p>
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
          </div>

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
        </div>
      )}

      {!ai && resource.status === 'COMPLETED' && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No AI analysis available for this resource.
        </p>
      )}

      {resource.status === 'PROCESSING' && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">AI analysis in progress...</p>
        </div>
      )}
    </div>
  );
}
