import { Injectable, Logger, Inject } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import { EmbeddingProvider } from './providers/embedding-provider.interface';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly prisma = getPrisma();

  constructor(@Inject('EMBEDDING_PROVIDER') private readonly provider: EmbeddingProvider) {}

  private truncate(text: string, maxChars: number = 8000): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  }

  async generateAndStore(
    resourceId: string,
    text: string,
  ): Promise<{ dimensions: number; model: string }> {
    const truncated = this.truncate(text);
    const { embeddings, model } = await this.provider.generate([truncated]);
    const vector = embeddings[0];

    if (!vector || vector.length === 0) {
      throw new Error('Empty embedding vector returned');
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" ("id", "resourceId", "vector", "createdAt", "updatedAt")
       VALUES ($1, $2, $3::vector, NOW(), NOW())
       ON CONFLICT ("resourceId")
       DO UPDATE SET "vector" = $3::vector, "updatedAt" = NOW()`,
      crypto.randomUUID(),
      resourceId,
      JSON.stringify(vector),
    );

    this.logger.log(`Embedding stored for resource ${resourceId} (${model}, ${vector.length} dims)`);

    return { dimensions: vector.length, model };
  }

  async generateEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
    const truncated = this.truncate(text);
    const { embeddings, model } = await this.provider.generate([truncated]);
    const embedding = embeddings[0];
    if (!embedding) {
      throw new Error('Empty embedding vector returned');
    }
    return { embedding, model };
  }

  async deleteByResourceId(resourceId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "Embedding" WHERE "resourceId" = $1`,
      resourceId,
    );
  }
}
