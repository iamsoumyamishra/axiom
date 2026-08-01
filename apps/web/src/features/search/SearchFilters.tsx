'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import type { SearchFacets } from './types';

export interface SearchFiltersValue {
  category?: string;
  tag?: string;
  projectId?: string;
}

interface ProjectOption {
  id: string;
  name: string;
  color: string | null;
}

export function SearchFilters({
  value,
  onChange,
}: {
  value: SearchFiltersValue;
  onChange: (patch: SearchFiltersValue) => void;
}) {
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    apiGet<SearchFacets>('search/facets').then((res) => {
      if (res.success && res.data) setFacets(res.data);
    });
    apiGet<ProjectOption[]>('projects/options').then((res) => {
      if (res.success && res.data) setProjects(res.data);
    });
  }, []);

  const select =
    'px-2 py-1.5 text-sm border border-input rounded-md bg-background';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={value.category ?? ''}
        onChange={(e) => onChange({ category: e.target.value || undefined })}
        className={select}
      >
        <option value="">All categories</option>
        {(facets?.categories ?? []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={value.tag ?? ''}
        onChange={(e) => onChange({ tag: e.target.value || undefined })}
        className={select}
      >
        <option value="">All tags</option>
        {(facets?.tags ?? []).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        value={value.projectId ?? ''}
        onChange={(e) => onChange({ projectId: e.target.value || undefined })}
        className={select}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
