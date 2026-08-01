'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRightLeft, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { apiPost } from '../../lib/api';
import type { MergeSuggestion, MergeSuggestionCandidate, ResourceDetail, ResourceListItem } from './types';

function isFullResource(
  r: ResourceListItem | MergeSuggestionCandidate | null,
): r is ResourceListItem {
  return r !== null && 'description' in r;
}

interface MergeConfirmDialogProps {
  suggestion: MergeSuggestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: (deletedId: string) => void;
}

function ResourceColumn({
  title,
  url,
  savedAt,
  status,
  summary,
  accent,
}: {
  title: string | null;
  url: string | null;
  savedAt: string;
  status: string;
  summary?: string | null;
  accent: 'source' | 'keep';
}) {
  return (
    <div
      className={
        accent === 'keep'
          ? 'rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-2'
          : 'rounded-lg border p-4 space-y-2'
      }
    >
      <Badge variant={accent === 'keep' ? 'default' : 'secondary'}>
        {accent === 'keep' ? 'Keep' : 'Merge away'}
      </Badge>
      <div>
        <p className="font-medium leading-snug">{title ?? 'Untitled'}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{url}</span>
          </a>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Saved {new Date(savedAt).toLocaleDateString()}</span>
        <Badge variant="outline">{status}</Badge>
      </div>
      {summary && <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>}
    </div>
  );
}

export function MergeConfirmDialog({
  suggestion,
  open,
  onOpenChange,
  onMerged,
}: MergeConfirmDialogProps) {
  const [direction, setDirection] = useState<'toCandidate' | 'toDuplicate'>('toCandidate');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSwap = Boolean(suggestion.candidate);
  const from = direction === 'toCandidate' ? suggestion.duplicate : suggestion.candidate;
  const to = direction === 'toCandidate' ? suggestion.candidate : suggestion.duplicate;
  const fromDescription = isFullResource(from) ? from.description : null;

  const handleConfirm = async () => {
    if (!from || !to) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiPost<ResourceDetail>('resources/merge', {
        duplicateId: from.id,
        canonicalId: to.id,
      });
      if (res.success) {
        toast.success(`Merged "${from.title ?? 'resource'}" into "${to.title ?? 'resource'}"`);
        onMerged(from.id);
        onOpenChange(false);
      } else {
        setError(res.error?.message ?? 'Failed to merge resources');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge duplicates</DialogTitle>
          <DialogDescription>
            Confirm which resource to keep. The other is merged into it and deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ResourceColumn
              title={from?.title ?? null}
              url={from?.url ?? null}
              savedAt={from?.savedAt ?? suggestion.duplicate.savedAt}
              status={from?.status ?? suggestion.duplicate.status}
              summary={fromDescription}
              accent="source"
            />
            <ResourceColumn
              title={to?.title ?? null}
              url={to?.url ?? null}
              savedAt={to?.savedAt ?? suggestion.candidate?.savedAt ?? ''}
              status={to?.status ?? 'COMPLETED'}
              accent="keep"
            />
          </div>

          {canSwap && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                setDirection((d) => (d === 'toCandidate' ? 'toDuplicate' : 'toCandidate'))
              }
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Swap which one to keep
            </Button>
          )}

          {!canSwap && (
            <p className="text-xs text-muted-foreground text-center">
              The candidate resource no longer exists, so direction cannot be swapped.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !to}>
            {saving ? 'Merging…' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
