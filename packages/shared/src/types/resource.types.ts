export enum ResourceStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
}

export enum RelationshipType {
  SIMILAR = 'similar',
  REFERENCES = 'references',
  CONTRADICTS = 'contradicts',
  CONTINUES = 'continues',
  PREREQUISITE = 'prerequisite',
  ALTERNATIVE = 'alternative',
  SAME_TOPIC = 'same_topic',
  SAME_AUTHOR = 'same_author',
  SAME_PROJECT = 'same_project',
  DUPLICATE = 'duplicate',
  VERSION_UPDATE = 'version_update',
}

export interface ResourceMetadata {
  author?: string;
  publishDate?: string;
  language?: string;
  ogImage?: string;
  ogDescription?: string;
  favicon?: string;
  siteName?: string;
  wordCount?: number;
  readingTime?: number;
  [key: string]: unknown;
}

export interface AINamedEntity {
  name: string;
  type: 'person' | 'organization' | 'place' | 'concept' | 'technology' | 'product' | 'event';
  confidence: number;
}

export interface AIAnalysisResult {
  category: string;
  subcategory?: string;
  summary: string;
  importance: number;
  qualityScore?: number;
  noveltyScore?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  readingTime?: number;
  tags: string[];
  topics: string[];
  keyConcepts: string[];
  entities: AINamedEntity[];
  duplicateOf?: string;
  duplicateConfidence?: number;
}

export interface RelatedResource {
  relationshipId: string;
  resource: {
    id: string;
    title: string | null;
    url: string | null;
    savedAt: string;
    status: ResourceStatus;
  };
  type: RelationshipType;
  confidence: number | null;
}
