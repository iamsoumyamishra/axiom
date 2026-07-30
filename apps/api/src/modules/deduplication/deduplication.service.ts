import { Injectable, Logger } from '@nestjs/common';
import { getPrisma } from '@axiom/data';

export interface UrlDedupResult {
  exists: boolean;
  resourceId?: string;
  confidence: 'exact' | 'normalized';
}

export interface ContentDedupResult {
  isDuplicate: boolean;
  duplicateOf?: string;
  confidence: number;
  action: 'duplicate' | 'flag' | 'none';
}

const HIGH_CONFIDENCE_THRESHOLD = 0.1;
const MODERATE_CONFIDENCE_THRESHOLD = 0.3;

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'ref', 'source', 'si',
]);

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);
  private readonly prisma = getPrisma();

  normalizeUrl(raw: string): string {
    try {
      const url = new URL(raw);
      url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
      url.protocol = url.protocol.toLowerCase();
      url.hash = '';

      const params = new URLSearchParams(url.search);
      for (const key of params.keys()) {
        if (TRACKING_PARAMS.has(key)) {
          params.delete(key);
        }
      }
      params.sort();
      url.search = params.toString();

      let normalized = url.toString();
      normalized = normalized.replace(/\/$/, '');

      return normalized;
    } catch {
      return raw;
    }
  }

  async checkUrlDuplicate(userId: string, url: string): Promise<UrlDedupResult> {
    const existing = await this.prisma.resource.findMany({
      where: { userId, url: { not: null } },
      select: { id: true, url: true },
    });

    const normalized = this.normalizeUrl(url);

    const exact = existing.find((r) => r.url === url);
    if (exact) {
      return { exists: true, resourceId: exact.id, confidence: 'exact' };
    }

    const normalizedMatch = existing.find((r) => r.url && this.normalizeUrl(r.url) === normalized);
    if (normalizedMatch) {
      return { exists: true, resourceId: normalizedMatch.id, confidence: 'normalized' };
    }

    return { exists: false, confidence: 'exact' };
  }

  async checkSemanticDuplicate(
    resourceId: string,
    userId: string,
  ): Promise<ContentDedupResult | null> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: { status: true },
    });

    if (!resource || resource.status === 'DUPLICATE') {
      return null;
    }

    const rows = await this.prisma.$queryRawUnsafe<
      { resourceId: string; distance: number }[]
    >(
      `SELECT e."resourceId", e."vector" <-> $1::vector AS distance
       FROM "Embedding" e
       JOIN "Resource" r ON r."id" = e."resourceId"
       WHERE e."resourceId" != $2
         AND r."userId" = $3
         AND r."status" != 'DUPLICATE'
       ORDER BY distance ASC
       LIMIT 1`,
      await this.getEmbeddingVector(resourceId),
      resourceId,
      userId,
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (!row) return null;

    const { resourceId: matchId, distance } = row;
    const confidence = 1 - distance;

    if (distance < HIGH_CONFIDENCE_THRESHOLD) {
      await this.prisma.resource.update({
        where: { id: resourceId },
        data: { status: 'DUPLICATE' },
      });

      await this.prisma.aIAnalysis.upsert({
        where: { resourceId },
        create: {
          resourceId,
          duplicateOf: matchId,
          duplicateConfidence: confidence,
        },
        update: {
          duplicateOf: matchId,
          duplicateConfidence: confidence,
        },
      });

      await this.prisma.$executeRawUnsafe(
        `DELETE FROM "Embedding" WHERE "resourceId" = $1`,
        resourceId,
      );

      this.logger.log(`Resource ${resourceId} marked as duplicate of ${matchId} (confidence: ${confidence.toFixed(4)})`);

      return { isDuplicate: true, duplicateOf: matchId, confidence, action: 'duplicate' };
    }

    if (distance < MODERATE_CONFIDENCE_THRESHOLD) {
      await this.prisma.aIAnalysis.upsert({
        where: { resourceId },
        create: {
          resourceId,
          duplicateConfidence: confidence,
        },
        update: {
          duplicateConfidence: confidence,
        },
      });

      return { isDuplicate: false, duplicateOf: matchId, confidence, action: 'flag' };
    }

    return { isDuplicate: false, confidence, action: 'none' };
  }

  private async getEmbeddingVector(resourceId: string): Promise<number[]> {
    const rows = await this.prisma.$queryRawUnsafe<{ vector: string }[]>(
      `SELECT "vector"::text FROM "Embedding" WHERE "resourceId" = $1`,
      resourceId,
    );

    if (rows.length === 0) {
      throw new Error(`No embedding found for resource ${resourceId}`);
    }

    const row = rows[0];
    if (!row) throw new Error(`No embedding found for resource ${resourceId}`);

    return JSON.parse(row.vector);
  }
}
