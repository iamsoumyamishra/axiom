'use client';

import { useState } from 'react';
import { apiGet } from '../../lib/api';
import { useCursorFeed } from '../../lib/useCursorFeed';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { ResourceCard } from './ResourceCard';
import { FilterBar } from './FilterBar';
import type { ResourceListItem, ResourceFilters, ResourceListResponse } from './types';

export function ResourceList() {
  const [filters, setFilters] = useState<ResourceFilters>({
    sortBy: 'savedAt',
    sortOrder: 'desc',
    pageSize: 20,
  });

  const params = {
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    search: filters.search,
    category: filters.category,
    tag: filters.tag,
    projectId: filters.projectId,
    collectionId: filters.collectionId,
  };

  const { items: resources, meta, loading, loadingMore, error, loadMore } =
    useCursorFeed<ResourceListItem>({
      scopeKey: JSON.stringify({ path: 'resources', params }),
      pageSize: filters.pageSize ?? 20,
      fetcher: async (cursor, pageSize) => {
        const res = await apiGet<ResourceListResponse>('resources', {
          cursor,
          pageSize: String(pageSize),
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          search: params.search,
          category: params.category,
          tag: params.tag,
          projectId: params.projectId,
          collectionId: params.collectionId,
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message ?? 'Failed to load resources');
        }
        return res.data;
      },
    });

  return (
    <div className="space-y-4">
      {meta && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          total={meta.total ?? 0}
        />
      )}

      {loading && resources.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && resources.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No resources yet</p>
          <p className="text-sm">Save your first resource to get started.</p>
        </div>
      )}

      {resources.length > 0 && (
        <InfiniteScroll
          hasMore={meta?.hasMore ?? false}
          loading={loading || loadingMore}
          onLoadMore={loadMore}
        >
          <div className="space-y-2">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
