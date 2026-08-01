'use client';

import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useCursorFeed } from '../../lib/useCursorFeed';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { MergeConfirmDialog } from './MergeConfirmDialog';
import type { MergeSuggestion, MergeSuggestionListResponse } from './types';

function confidencePercent(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

export function MergeSuggestionsList() {
  const [active, setActive] = useState<MergeSuggestion | null>(null);

  const { items: suggestions, meta, loading, loadingMore, error, loadMore, removeItem } =
    useCursorFeed<MergeSuggestion>({
      scopeKey: JSON.stringify({ path: 'duplicates' }),
      pageSize: 20,
      fetcher: async (cursor, pageSize) => {
        const res = await apiGet<MergeSuggestionListResponse>('resources/suggestions', {
          cursor,
          pageSize: String(pageSize),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message ?? 'Failed to load suggestions');
        }
        const data = res.data.data.map((s) => ({ ...s, id: s.duplicate.id }));
        return { data, meta: res.data.meta };
      },
    });

  return (
    <div className="space-y-4">
      {meta && (
        <p className="text-sm text-muted-foreground">
          {meta.total ?? 0} duplicate{meta.total === 1 ? '' : 's'} awaiting review
        </p>
      )}

      {loading && suggestions.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-secondary rounded w-2/3" />
              <div className="h-3 bg-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <GitMerge className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-lg font-medium mb-1">No duplicates found</p>
          <p className="text-sm">
            When the system flags similar resources, they&apos;ll show up here for review.
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <InfiniteScroll
          hasMore={meta?.hasMore ?? false}
          loading={loading || loadingMore}
          onLoadMore={loadMore}
        >
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          s.duplicate.status === 'DUPLICATE' ? 'destructive' : 'secondary'
                        }
                      >
                        {s.duplicate.status === 'DUPLICATE' ? 'Auto-marked' : 'Flagged'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Duplicate confidence:{' '}
                        <span className="font-medium text-foreground">
                          {confidencePercent(s.confidence)}
                        </span>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!s.candidate}
                      title={
                        s.candidate ? 'Review and merge' : 'Candidate resource no longer exists'
                      }
                      onClick={() => setActive(s)}
                    >
                      <GitMerge className="mr-2 h-4 w-4" />
                      Merge
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                        Duplicate
                      </p>
                      <p className="font-medium truncate">{s.duplicate.title ?? 'Untitled'}</p>
                      {s.duplicate.url && (
                        <p className="text-xs text-muted-foreground truncate">{s.duplicate.url}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Saved {new Date(s.duplicate.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                        Candidate
                      </p>
                      {s.candidate ? (
                        <>
                          <p className="font-medium truncate">{s.candidate.title ?? 'Untitled'}</p>
                          {s.candidate.url && (
                            <p className="text-xs text-muted-foreground truncate">
                              {s.candidate.url}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Saved {new Date(s.candidate.savedAt).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Missing (deleted)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      )}

      {active && (
        <MergeConfirmDialog
          suggestion={active}
          open
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
          onMerged={(deletedId) => removeItem(deletedId)}
        />
      )}
    </div>
  );
}
