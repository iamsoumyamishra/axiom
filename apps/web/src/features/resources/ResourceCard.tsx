'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiPost } from '../../lib/api';
import type { ResourceDetail, ResourceListItem } from './types';

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-slate-100 text-slate-600',
  FAILED: 'bg-red-100 text-red-700',
  DUPLICATE: 'bg-purple-100 text-purple-700',
};

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ResourceCard({
  resource,
  onRetried,
}: {
  resource: ResourceListItem;
  onRetried?: (id: string) => void;
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (retrying) return;
    setRetrying(true);
    try {
      const res = await apiPost<ResourceDetail>(`resources/${resource.id}/retry`);
      if (res.success) {
        toast.success('Retrying…');
        onRetried?.(resource.id);
      } else {
        toast.error(res.error?.message ?? 'Failed to retry');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        {resource.url && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${getDomain(resource.url)}&sz=32`}
            alt=""
            className="w-5 h-5 mt-1 shrink-0 rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/resources/${resource.id}`} className="font-medium truncate hover:underline">
              {resource.title ?? 'Untitled'}
            </Link>
            {resource.status !== 'COMPLETED' && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0',
                  statusStyles[resource.status] ?? 'bg-slate-100 text-slate-600',
                )}
              >
                {resource.status}
              </span>
            )}
            {resource.status === 'FAILED' && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-input text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                title="Retry failed pipeline"
              >
                {retrying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Retry
              </button>
            )}
          </div>
          {resource.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {resource.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {getDomain(resource.url) && (
              <span className="truncate">{getDomain(resource.url)}</span>
            )}
            <span>{timeAgo(resource.savedAt)}</span>
            {resource.resourceType !== 'website' && (
              <span className="capitalize">{resource.resourceType.replace(/_/g, ' ')}</span>
            )}
          </div>
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="text-[11px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded"
                >
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}
          {resource.projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {resource.projects.map(({ project }) => (
                <span
                  key={project.id}
                  className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: project.color ?? '#64748b' }}
                  />
                  {project.name}
                </span>
              ))}
            </div>
          )}
          {resource.collections.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {resource.collections.map(({ collection }) => (
                <span
                  key={collection.id}
                  className="text-[11px] px-1.5 py-0.5 text-violet-700 bg-violet-50 border border-violet-200 rounded"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
