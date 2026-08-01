export interface SaveResourceDto {
  url: string;
  title?: string;
  selectedText?: string;
  html?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  screenshot?: string;
  projectIds?: string[];
  collectionIds?: string[];
}

export interface SaveTextDto {
  title: string;
  text: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceQueryDto {
  cursor?: string;
  pageSize?: number;
  search?: string;
  category?: string;
  tag?: string;
  projectId?: string;
  collectionId?: string;
  sortBy?: 'savedAt' | 'createdAt' | 'title' | 'importance';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
