import { z } from 'zod';

export const entitySchema = z.object({
  name: z.string(),
  type: z.enum([
    'person',
    'organization',
    'place',
    'concept',
    'technology',
    'product',
    'event',
  ]),
  confidence: z.number().min(0).max(1),
});

export const aiResponseSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  summary: z.string(),
  importance: z.number().int().min(1).max(10),
  qualityScore: z.number().min(0).max(1).optional(),
  noveltyScore: z.number().min(0).max(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  readingTime: z.number().int().min(1).optional(),
  tags: z.array(z.string()).min(1).max(20),
  topics: z.array(z.string()).optional(),
  keyConcepts: z.array(z.string()).optional(),
  entities: z.array(entitySchema).optional(),
  duplicateOf: z.string().optional(),
  duplicateConfidence: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
