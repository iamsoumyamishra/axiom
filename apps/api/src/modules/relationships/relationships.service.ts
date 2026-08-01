import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import { RelationshipType } from '@axiom/shared';

const SIMILAR_MAX_DISTANCE = 0.6;
const MAX_NEIGHBORS = 5;

interface RelatedRow {
  relationshipId: string;
  type: string;
  confidence: number | null;
  id: string;
  title: string | null;
  url: string | null;
  savedAt: Date;
  status: string;
}

@Injectable()
export class RelationshipsService {
  private readonly logger = new Logger(RelationshipsService.name);
  private readonly prisma = getPrisma();

  async refreshSimilarRelationships(resourceId: string, userId: string) {
    const vector = await this.getEmbeddingVector(resourceId);
    if (!vector) return;

    const neighbors = await this.prisma.$queryRawUnsafe<
      { resourceId: string; distance: number }[]
    >(
       `SELECT e."resourceId", e."vector" <=> $1::vector AS distance
       FROM "Embedding" e
       JOIN "Resource" r ON r."id" = e."resourceId"
       WHERE e."resourceId" != $2
         AND r."userId" = $3
         AND r."status" != 'DUPLICATE'
       ORDER BY distance ASC
       LIMIT $4`,
      JSON.stringify(vector),
      resourceId,
      userId,
      MAX_NEIGHBORS,
    );

    let created = 0;
    for (const neighbor of neighbors) {
      if (neighbor.distance >= SIMILAR_MAX_DISTANCE) continue;

      const [sourceId, targetId] = [resourceId, neighbor.resourceId].sort() as [string, string];
      const confidence = 1 - neighbor.distance;

      await this.prisma.relationship.upsert({
        where: {
          sourceId_targetId_type: {
            sourceId,
            targetId,
            type: RelationshipType.SIMILAR,
          },
        },
        update: { confidence },
        create: {
          sourceId,
          targetId,
          type: RelationshipType.SIMILAR,
          confidence,
        },
      });
      created += 1;
    }

    if (created > 0) {
      this.logger.log(
        `Generated ${created} similar relationship(s) for resource ${resourceId}`,
      );
    }
  }

  async findRelated(resourceId: string, userId: string, limit = 10, type?: string) {
    const rows = await this.prisma.$queryRawUnsafe<RelatedRow[]>(
      `SELECT rl."id" AS "relationshipId", rl."type" AS type, rl."confidence" AS confidence,
              rr."id" AS id, rr."title" AS title, rr."url" AS url, rr."savedAt" AS "savedAt",
              rr."status" AS status
       FROM "Relationship" rl
       JOIN "Resource" rr
         ON rr."id" = CASE WHEN rl."sourceId" = $1 THEN rl."targetId" ELSE rl."sourceId" END
       WHERE (rl."sourceId" = $1 OR rl."targetId" = $1)
         AND rr."userId" = $2
         AND rr."status" != 'DUPLICATE'
         AND ($3::text IS NULL OR rl."type" = $3)
       ORDER BY rl."confidence" DESC NULLS LAST, rr."savedAt" DESC
       LIMIT $4`,
      resourceId,
      userId,
      type ?? null,
      limit,
    );

    return rows.map((row) => ({
      relationshipId: row.relationshipId,
      resource: {
        id: row.id,
        title: row.title,
        url: row.url,
        savedAt: row.savedAt,
        status: row.status,
      },
      type: row.type as RelationshipType,
      confidence: row.confidence,
    }));
  }

  async remove(relationshipId: string, userId: string) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        source: { select: { userId: true } },
        target: { select: { userId: true } },
      },
    });

    if (
      !relationship ||
      relationship.source.userId !== userId ||
      relationship.target.userId !== userId
    ) {
      throw new NotFoundException('Relationship not found');
    }

    await this.prisma.relationship.delete({ where: { id: relationshipId } });
    return { message: 'Relationship removed' };
  }

  async getGraph(userId: string, focusId?: string, type?: string) {
    const resources = await this.prisma.resource.findMany({
      where: { userId, status: { not: 'DUPLICATE' } },
      select: {
        id: true,
        title: true,
        url: true,
        resourceType: true,
        status: true,
        aiAnalysis: { select: { category: true } },
      },
    });

    const relationships = await this.prisma.relationship.findMany({
      where: type ? { type } : {},
      select: {
        sourceId: true,
        targetId: true,
        type: true,
        confidence: true,
      },
    });

    const resourceIds = new Set(resources.map((r) => r.id));

    const edges = relationships
      .filter(
        (rel) =>
          resourceIds.has(rel.sourceId) &&
          resourceIds.has(rel.targetId) &&
          rel.sourceId !== rel.targetId,
      )
      .map((rel) => ({
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        type: rel.type,
        confidence: rel.confidence,
      }));

    let nodes = resources.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      resourceType: r.resourceType,
      status: r.status,
      category: r.aiAnalysis?.category ?? null,
    }));

    if (focusId) {
      const focusEdges = edges.filter(
        (e) => e.sourceId === focusId || e.targetId === focusId,
      );
      const neighborIds = new Set<string>();
      for (const edge of focusEdges) {
        neighborIds.add(edge.sourceId === focusId ? edge.targetId : edge.sourceId);
      }
      if (neighborIds.size > 0 || resourceIds.has(focusId)) {
        const included = new Set([focusId, ...neighborIds]);
        nodes = nodes.filter((n) => included.has(n.id));
      }
    }

    const includedIds = new Set(nodes.map((n) => n.id));
    const scopedEdges = edges.filter(
      (e) => includedIds.has(e.sourceId) && includedIds.has(e.targetId),
    );

    return { nodes, edges: scopedEdges };
  }

  private async getEmbeddingVector(resourceId: string): Promise<number[] | null> {
    const rows = await this.prisma.$queryRawUnsafe<{ vector: string }[]>(
      `SELECT "vector"::text FROM "Embedding" WHERE "resourceId" = $1`,
      resourceId,
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    if (!row) return null;

    return JSON.parse(row.vector);
  }
}
