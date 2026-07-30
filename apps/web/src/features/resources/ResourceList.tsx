'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { ResourceCard } from './ResourceCard';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import type { ResourceListItem, ResourceFilters, PaginatedResponse } from './types';

export function ResourceList() {
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<ResourceListItem>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ResourceFilters>({
    sortBy: 'savedAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20,
  });

  const fetchResources = async (f: ResourceFilters) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<PaginatedResponse<ResourceListItem>>('resources', {
        page: String(f.page ?? 1),
        pageSize: String(f.pageSize ?? 20),
        sortBy: f.sortBy,
        sortOrder: f.sortOrder,
        search: f.search,
        category: f.category,
        tag: f.tag,
      });
      if (res.success && res.data) {
        setResources(res.data.data);
        setMeta(res.data.meta);
      } else {
        setError(res.error?.message ?? 'Failed to load resources');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(filters);
  }, [filters]);

  return (
    <div className="space-y-4">
      {meta && (
        <FilterBar filters={filters} onFiltersChange={setFilters} total={meta.total} />
      )}

      {loading && (
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

      {!loading && resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
}
