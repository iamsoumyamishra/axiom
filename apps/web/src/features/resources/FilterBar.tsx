'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import type { ResourceFilters } from './types';

interface FilterBarProps {
  filters: ResourceFilters;
  onFiltersChange: (filters: ResourceFilters) => void;
  total: number;
}

interface ProjectOption {
  id: string;
  name: string;
  color: string | null;
}

interface CollectionOption {
  id: string;
  name: string;
  isAuto: boolean;
}

export function FilterBar({ filters, onFiltersChange, total }: FilterBarProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);

  useEffect(() => {
    apiGet<ProjectOption[]>('projects/options').then((res) => {
      if (res.success && res.data) setProjects(res.data);
    });
    apiGet<CollectionOption[]>('collections/options').then((res) => {
      if (res.success && res.data) setCollections(res.data);
    });
  }, []);

  const update = (patch: Partial<ResourceFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ search: search || undefined });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background"
        />
      </form>
      <select
        value={filters.projectId ?? ''}
        onChange={(e) => update({ projectId: e.target.value || undefined })}
        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={filters.collectionId ?? ''}
        onChange={(e) => update({ collectionId: e.target.value || undefined })}
        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background"
      >
        <option value="">All collections</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={filters.sortBy ?? 'savedAt'}
        onChange={(e) => update({ sortBy: e.target.value as ResourceFilters['sortBy'] })}
        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background"
      >
        <option value="savedAt">Date saved</option>
        <option value="title">Title</option>
        <option value="createdAt">Date created</option>
      </select>
      <select
        value={filters.sortOrder ?? 'desc'}
        onChange={(e) => update({ sortOrder: e.target.value as ResourceFilters['sortOrder'] })}
        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background"
      >
        <option value="desc">Newest</option>
        <option value="asc">Oldest</option>
      </select>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {total} resource{total !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
