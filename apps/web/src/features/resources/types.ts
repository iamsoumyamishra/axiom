export type ResourceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DUPLICATE';

export interface ResourceListItem {
  id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  resourceType: string;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  tags: { tag: { id: string; name: string } }[];
  projects: { project: { id: string; name: string; color: string | null } }[];
}

export interface ResourceDetail extends ResourceListItem {
  metadata: Record<string, unknown> | null;
  userId: string;
  content: {
    id: string;
    markdown: string | null;
    cleanText: string | null;
    extractedAt: string | null;
  } | null;
  aiAnalysis: {
    id: string;
    resourceId: string;
    category: string | null;
    subcategory: string | null;
    summary: string | null;
    importance: number | null;
    qualityScore: number | null;
    noveltyScore: number | null;
    difficulty: string | null;
    readingTime: number | null;
    tags: string[];
    topics: string[];
    keyConcepts: string[];
    entities: { name: string; type: string; confidence: number }[] | null;
    model: string | null;
    confidence: number | null;
    reasoning: string | null;
    duplicateOf: string | null;
    duplicateConfidence: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  entities: {
    entity: { id: string; name: string; type: string; userId: string; createdAt: string };
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  tag?: string;
  sortBy?: 'savedAt' | 'createdAt' | 'title' | 'importance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
