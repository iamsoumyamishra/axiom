import { z } from 'zod';

export const saveResourceSchema = z.object({
  url: z.string().url('Invalid URL').max(2048),
  title: z.string().max(500).optional(),
  selectedText: z.string().max(50000).optional(),
  html: z.string().max(5_000_000).optional(),
  markdown: z.string().max(5_000_000).optional(),
  metadata: z.record(z.unknown()).optional(),
  screenshot: z.string().max(10_000_000).optional(),
});

export const saveTextSchema = z.object({
  title: z.string().min(1).max(500),
  text: z.string().min(1).max(100000),
  sourceUrl: z.string().url().max(2048).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const resourceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  projectId: z.string().optional(),
  collectionId: z.string().optional(),
  sortBy: z.enum(['savedAt', 'createdAt', 'title', 'importance']).default('savedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateResourceSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  projectId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
