'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layers, Plus, Sparkles } from 'lucide-react';
import { apiGet, apiDelete } from '../../../../lib/api';
import { LinkResourcesDialog } from '../../../../features/resources/LinkResourcesDialog';
import { Button } from '../../../../components/ui/button';
import { cn } from '../../../../lib/utils';
import type { CollectionDetail } from '../../../../features/collections/types';

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

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const fetchCollection = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<CollectionDetail>(`collections/${params.id}`);
      if (res.success && res.data) {
        setCollection(res.data);
      } else {
        setError(res.error?.message ?? 'Collection not found');
      }
    } catch {
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleRemove = async (resourceId: string) => {
    const res = await apiDelete(`collections/${params.id}/resources/${resourceId}`);
    if (res.success) {
      setCollection((c) =>
        c
          ? {
              ...c,
              resources: c.resources.filter((r) => r.id !== resourceId),
              _count: { resources: Math.max(0, c._count.resources - 1) },
            }
          : c,
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete collection "${collection?.name}"?`)) return;
    const res = await apiDelete(`collections/${params.id}`);
    if (res.success) router.push('/collections');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/3" />
        <div className="h-8 bg-secondary rounded w-2/3" />
        <div className="h-32 bg-secondary rounded" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive">{error ?? 'Collection not found'}</p>
        <button
          onClick={() => router.push('/collections')}
          className="text-sm text-primary underline mt-2"
        >
          Back to collections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/collections')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Collections
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Layers
              className={cn('h-5 w-5', collection.isAuto ? 'text-violet-500' : 'text-primary')}
            />
            <h1 className="text-2xl font-bold truncate">{collection.name}</h1>
            {collection.isAuto && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium shrink-0">
                <Sparkles className="h-3 w-3 inline mr-0.5" />
                Auto
              </span>
            )}
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {collection._count.resources} resource{collection._count.resources === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add resources
          </Button>
          {!collection.isAuto && (
            <Button variant="outline" onClick={handleDelete} className="text-destructive">
              Delete
            </Button>
          )}
        </div>
      </div>

      {collection.resources.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No resources in this collection yet.
        </div>
      ) : (
        <div className="space-y-2">
          {collection.resources.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              {r.url && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(r.url)}&sz=32`}
                  alt=""
                  className="w-5 h-5 shrink-0 rounded"
                />
              )}
              <a href={`/resources/${r.id}`} className="flex-1 min-w-0">
                <p className="font-medium truncate hover:underline">{r.title ?? 'Untitled'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {getDomain(r.url) ?? 'No domain'} · {timeAgo(r.savedAt)}
                </p>
              </a>
              <button
                onClick={() => handleRemove(r.id)}
                className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <LinkResourcesDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        linkPath={`collections/${collection.id}`}
        onAdded={fetchCollection}
      />
    </div>
  );
}
