import { Injectable, Logger } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import { EmbeddingsService } from '../embeddings/embeddings.service';

export interface SearchResult {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: Date;
  status: string;
  resourceType: string;
  distance: number | null;
  score: number;
  category: string | null;
  importance: number | null;
  summary: string | null;
  tags: string[];
}

export interface SearchOptions {
  userId: string;
  query: string;
  limit: number;
  cursor?: string;
  category?: string;
  tag?: string;
  projectId?: string;
}

interface RawRow {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: Date;
  status: string;
  resourceType: string;
  distance: number | null;
  category: string | null;
  importance: number | null;
  summary: string | null;
  tags: string[];
  description?: string | null;
  cleanText?: string | null;
  markdown?: string | null;
}

const RRF_K = 60;
const SNIPPET_WINDOW = 240;
const MAX_FETCH = 200;

function parseCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof parsed?.o === 'number' && Number.isInteger(parsed.o) && parsed.o >= 0) {
      return parsed.o;
    }
  } catch {
    // ignore malformed cursor
  }
  return 0;
}

function makeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset })).toString('base64url');
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly prisma = getPrisma();

  constructor(private readonly embeddingsService: EmbeddingsService) {}

  private buildFilters(
    filters: Pick<SearchOptions, 'category' | 'tag' | 'projectId'>,
    offset: number,
  ): {
    clause: string;
    params: unknown[];
  } {
    const parts: string[] = [];
    const params: unknown[] = [];
    let n = offset;

    if (filters.category) {
      params.push(filters.category);
      n += 1;
      parts.push(
        `AND (EXISTS (SELECT 1 FROM "AIAnalysis" a WHERE a."resourceId" = r."id" AND a."category" = $${n}))`,
      );
    }
    if (filters.tag) {
      params.push(filters.tag);
      n += 1;
      parts.push(
        `AND (EXISTS (SELECT 1 FROM "ResourceTag" rt JOIN "Tag" t ON t."id" = rt."tagId" WHERE rt."resourceId" = r."id" AND t."name" = $${n}))`,
      );
    }
    if (filters.projectId) {
      params.push(filters.projectId);
      n += 1;
      parts.push(
        `AND (EXISTS (SELECT 1 FROM "ResourceProject" rp WHERE rp."resourceId" = r."id" AND rp."projectId" = $${n}))`,
      );
    }

    return { clause: parts.join(' '), params };
  }

  private makeSnippet(row: RawRow, query: string): string | null {
    if (row.summary) return row.summary;

    const text = (row.cleanText ?? row.markdown ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return row.description ?? null;

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const lower = text.toLowerCase();
    let idx = -1;
    for (const term of terms) {
      const i = lower.indexOf(term);
      if (i !== -1 && (idx === -1 || i < idx)) idx = i;
    }

    const start = Math.max(0, (idx === -1 ? 0 : idx) - 80);
    let end = Math.min(text.length, start + SNIPPET_WINDOW);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = `…${snippet}`;
    if (end < text.length) snippet = `${snippet}…`;
    return snippet;
  }

  async getFacets(userId: string): Promise<{ categories: string[]; tags: string[] }> {
    const categories = await this.prisma.$queryRawUnsafe<{ category: string }[]>(
      `SELECT DISTINCT a."category" AS "category"
       FROM "AIAnalysis" a
       JOIN "Resource" r ON r."id" = a."resourceId"
       WHERE r."userId" = $1 AND a."category" IS NOT NULL
       ORDER BY a."category" ASC`,
      userId,
    );

    const tags = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT DISTINCT t."name" AS "name"
       FROM "Tag" t
       JOIN "ResourceTag" rt ON rt."tagId" = t."id"
       JOIN "Resource" r ON r."id" = rt."resourceId"
       WHERE r."userId" = $1 AND t."name" IS NOT NULL
       ORDER BY t."name" ASC`,
      userId,
    );

    return {
      categories: categories.map((c) => c.category),
      tags: tags.map((t) => t.name),
    };
  }

  async search(
    options: SearchOptions,
  ): Promise<{
    data: SearchResult[];
    meta: { query: string; tookMs: number; mode: string; pageSize: number; nextCursor: string | null; hasMore: boolean };
  }> {
    const start = Date.now();
    const { userId, query, limit } = options;

    if (!query.trim()) {
      return {
        data: [],
        meta: { query, tookMs: 0, mode: 'hybrid', pageSize: limit, nextCursor: null, hasMore: false },
      };
    }

    let embedding: number[] | null = null;
    try {
      const result = await this.embeddingsService.generateEmbedding(query);
      embedding = result.embedding;
    } catch {
      this.logger.warn('Embedding generation failed for search query, falling back to keyword-only');
    }

    const offset = parseCursor(options.cursor);
    const fetchLimit = Math.min(offset + limit * 2, MAX_FETCH);
    const mode = embedding ? 'hybrid' : 'keyword';

    const empty = (): {
      data: SearchResult[];
      meta: { query: string; tookMs: number; mode: string; pageSize: number; nextCursor: string | null; hasMore: boolean };
    } => ({
      data: [],
      meta: { query, tookMs: Date.now() - start, mode, pageSize: limit, nextCursor: null, hasMore: false },
    });

    if (offset >= MAX_FETCH || fetchLimit <= offset) return empty();

    let vectorRows: RawRow[] = [];
    if (embedding) {
      const vectorFilters = this.buildFilters(options, 3);
      vectorRows = await this.prisma.$queryRawUnsafe<RawRow[]>(
        `SELECT r."id", r."title", r."url", r."savedAt", r."status", r."resourceType",
                e."vector" <=> $1::vector AS "distance",
                a."category", a."importance", a."summary", a."tags",
                r."description"
         FROM "Embedding" e
         JOIN "Resource" r ON r."id" = e."resourceId"
         LEFT JOIN "AIAnalysis" a ON a."resourceId" = r."id"
         WHERE r."userId" = $2
           AND r."status" != 'DUPLICATE'
           ${vectorFilters.clause}
         ORDER BY "distance" ASC
         LIMIT $3`,
        JSON.stringify(embedding),
        userId,
        fetchLimit,
        ...vectorFilters.params,
      );
    }

    const keywordFilters = this.buildFilters(options, 4);
    const keywordRows = await this.prisma.$queryRawUnsafe<RawRow[]>(
      `SELECT r."id", r."title", r."url", r."savedAt", r."status", r."resourceType",
              NULL::float8 AS "distance",
              a."category", a."importance", a."summary", a."tags",
              r."description", rc."cleanText", rc."markdown"
       FROM "Resource" r
       LEFT JOIN "AIAnalysis" a ON a."resourceId" = r."id"
       LEFT JOIN "ResourceContent" rc ON rc."resourceId" = r."id"
       WHERE r."userId" = $1
         AND r."status" != 'DUPLICATE'
         ${keywordFilters.clause}
         AND (
           to_tsvector('english', COALESCE(r."title", '')) @@ plainto_tsquery('english', $2)
           OR r."title" ILIKE $3
           OR COALESCE(r."description", '') ILIKE $3
         )
       ORDER BY ts_rank(to_tsvector('english', COALESCE(r."title", '')), plainto_tsquery('english', $2)) DESC,
                r."savedAt" DESC
       LIMIT $4`,
      userId,
      query,
      `%${query}%`,
      fetchLimit,
      ...keywordFilters.params,
    );

    const scores = new Map<string, number>();
    const merged = new Map<string, RawRow>();

    const add = (row: RawRow, rank: number) => {
      scores.set(row.id, (scores.get(row.id) ?? 0) + 1 / (RRF_K + rank));
      if (!merged.has(row.id)) merged.set(row.id, row);
    };

    vectorRows.forEach((row, i) => add(row, i + 1));
    keywordRows.forEach((row, i) => add(row, i + 1));

    const all: SearchResult[] = [...merged.values()]
      .map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        savedAt: row.savedAt,
        status: row.status,
        resourceType: row.resourceType,
        distance: row.distance,
        score: scores.get(row.id) ?? 0,
        category: row.category,
        importance: row.importance,
        summary: this.makeSnippet(row, query),
        tags: Array.isArray(row.tags) ? row.tags : [],
      }))
      .sort((a, b) => b.score - a.score);

    const data = all.slice(offset, offset + limit);
    const hasMore = all.length > offset + limit;
    const nextCursor = hasMore ? makeCursor(offset + limit) : null;

    return {
      data,
      meta: { query, tookMs: Date.now() - start, mode, pageSize: limit, nextCursor, hasMore },
    };
  }
}
