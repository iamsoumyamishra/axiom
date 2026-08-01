import type { CursorMeta } from '../../lib/cursor';

export type ResourceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DUPLICATE';

export interface SearchResult {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: string;
  status: ResourceStatus;
  resourceType: string;
  distance: number | null;
  score: number;
  category: string | null;
  importance: number | null;
  summary: string | null;
  tags: string[];
}

export interface SearchMeta extends CursorMeta {
  query: string;
  tookMs: number;
  mode?: string;
}

export interface SearchFacets {
  categories: string[];
  tags: string[];
}
