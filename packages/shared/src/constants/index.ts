export const API_VERSION = 'v1';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const IMPORTANCE = {
  MIN: 1,
  MAX: 10,
} as const;

export const QUEUES = {
  INGESTION: 'ingestion',
  ANALYSIS: 'analysis',
  EMBEDDING: 'embedding',
  RELATIONSHIP: 'relationship',
} as const;

export const ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
