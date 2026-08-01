'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiGet, apiPost } from '../../lib/api';
import type { ResourceListItem, ResourceListResponse } from '../resources/types';

interface LinkResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkPath: string;
  onAdded: () => void;
}

export function LinkResourcesDialog({
  open,
  onOpenChange,
  linkPath,
  onAdded,
}: LinkResourcesDialogProps) {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch('');
      return;
    }

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGet<ResourceListResponse>('resources', {
          pageSize: '100',
        });
        if (res.success && res.data) {
          setResources(res.data.data);
        } else {
          setError(res.error?.message ?? 'Failed to load resources');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, linkPath]);

  const filtered = resources.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.title ?? '').toLowerCase().includes(q) || (r.url ?? '').toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');
    try {
      for (const id of selected) {
        await apiPost(`${linkPath}/resources/${id}`);
      }
      onOpenChange(false);
      onAdded();
      router.refresh();
    } catch {
      setError('Failed to link resources');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add resources</DialogTitle>
          <DialogDescription>Select saved resources to add.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title or URL…"
            autoFocus
          />

          <div className="max-h-80 overflow-y-auto space-y-1">
            {loading && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
            {!loading && error && (
              <p className="text-sm text-red-600 py-4 text-center">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No resources found. Save some first.
              </p>
            )}
            {!loading &&
              filtered.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title ?? 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                  </div>
                </label>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selected.size === 0}>
            {saving ? 'Linking…' : `Link ${selected.size || ''} resource${selected.size === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
