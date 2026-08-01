'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Layers, Sparkles, RefreshCw } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import { CollectionFormDialog } from './CollectionFormDialog';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import type { Collection } from './types';

function CollectionCard({
  collection,
  onDelete,
}: {
  collection: Collection;
  onDelete: (c: Collection) => void;
}) {
  return (
    <div className="relative group">
      <Link
        href={`/collections/${collection.id}`}
        className="block rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-2 mb-1">
          <Layers className={cn('h-4 w-4', collection.isAuto ? 'text-violet-500' : 'text-primary')} />
          <h3 className="font-medium truncate">{collection.name}</h3>
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{collection.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {collection._count.resources} resource{collection._count.resources === 1 ? '' : 's'}
        </p>
      </Link>
      {!collection.isAuto && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs text-destructive"
            onClick={() => onDelete(collection)}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export function CollectionsList() {
  const router = useRouter();
  const [auto, setAuto] = useState<Collection[]>([]);
  const [manual, setManual] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<{ auto: Collection[]; manual: Collection[] }>('collections');
      if (res.success && res.data) {
        setAuto(res.data.auto);
        setManual(res.data.manual);
      } else {
        setError(res.error?.message ?? 'Failed to load collections');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await apiPost<{ synced: number }>('collections/sync');
      if (res.success) {
        await fetchCollections();
      } else {
        setError(res.error?.message ?? 'Sync failed');
      }
    } catch {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`Delete collection "${collection.name}"?`)) return;
    const res = await apiDelete(`collections/${collection.id}`);
    if (res.success) {
      setManual((m) => m.filter((c) => c.id !== collection.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Collections</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync from tags'}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New collection
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-secondary/50 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4 text-violet-500" /> Auto-generated from AI tags
            </h3>
            {auto.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
                No auto collections yet. They appear here automatically as resources are analyzed.
                You can also run <span className="font-medium">Sync from tags</span>.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {auto.map((c) => (
                  <CollectionCard key={c.id} collection={c} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <Layers className="h-4 w-4 text-primary" /> Manual
            </h3>
            {manual.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
                Create your own collections to hand-curate resources.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {manual.map((c) => (
                  <CollectionCard key={c.id} collection={c} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CollectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchCollections}
      />
    </div>
  );
}
