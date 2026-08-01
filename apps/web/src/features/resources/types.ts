import type { CursorListResponse } from '../../lib/cursor';

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
  collections: { collection: { id: string; name: string; isAuto: boolean } }[];
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

export interface ResourceFilters {
  search?: string;
  category?: string;
  tag?: string;
  projectId?: string;
  collectionId?: string;
  sortBy?: 'savedAt' | 'createdAt' | 'title' | 'importance';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

export type ResourceListResponse = CursorListResponse<ResourceListItem>;

export interface RelatedResource {
  relationshipId: string;
  resource: {
    id: string;
    title: string | null;
    url: string | null;
    savedAt: string;
    status: ResourceStatus;
  };
  type: string;
  confidence: number | null;
}
