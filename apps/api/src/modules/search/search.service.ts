import { Injectable, Logger } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import { EmbeddingsService } from '../embeddings/embeddings.service';

export interface SearchResult {
  id: string;
  title: string;
  url: string | null;
  savedAt: Date;
  distance: number | null;
}

interface SearchOptions {
  userId: string;
  query: string;
  limit: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly prisma = getPrisma();

  constructor(private readonly embeddingsService: EmbeddingsService) {}

  async search(options: SearchOptions): Promise<{ data: SearchResult[]; meta: { query: string; tookMs: number } }> {
    const start = Date.now();
    const { userId, query, limit } = options;

    let embedding: number[] | null = null;
    try {
      const result = await this.embeddingsService.generateEmbedding(query);
      embedding = result.embedding;
    } catch {
      this.logger.warn('Embedding generation failed for search query, falling back to text-only');
    }

    let data: SearchResult[];
    if (embedding) {
      data = await this.prisma.$queryRawUnsafe<SearchResult[]>(
        `SELECT
           r."id",
           r."title",
           r."url",
           r."savedAt",
           e."vector" <-> $1::vector AS "distance"
         FROM "Embedding" e
         JOIN "Resource" r ON r."id" = e."resourceId"
         WHERE r."userId" = $2
         ORDER BY "distance" ASC
         LIMIT $3`,
        JSON.stringify(embedding),
        userId,
        limit,
      );
    } else {
      data = await this.prisma.$queryRawUnsafe<SearchResult[]>(
        `SELECT
           r."id",
           r."title",
           r."url",
           r."savedAt",
           NULL AS "distance"
         FROM "Resource" r
         WHERE r."userId" = $1
           AND (
             to_tsvector('english', COALESCE(r."title", '')) @@ plainto_tsquery('english', $2)
             OR r."title" ILIKE $3
           )
         ORDER BY r."savedAt" DESC
         LIMIT $4`,
        userId,
        query,
        `%${query}%`,
        limit,
      );
    }

    const tookMs = Date.now() - start;

    return { data, meta: { query, tookMs } };
  }
}
