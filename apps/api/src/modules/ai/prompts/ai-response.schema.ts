import { z } from 'zod';

const clampInt = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;

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
  importance: z.number().transform(v => clampInt(v, 1, 10)),
  qualityScore: z.number().min(0).max(1).optional(),
  noveltyScore: z.number().min(0).max(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  readingTime: z
    .number()
    .optional()
    .transform(v => (v === undefined ? undefined : clampInt(v, 1, 600))),
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
