import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getPrisma } from '@axiom/data';
import type { SaveResourceDto, ResourceQueryDto, UpdateResourceDto } from '@axiom/shared';
import type { Prisma } from '@prisma/client';
import { DeduplicationService } from '../deduplication/deduplication.service';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
  private readonly prisma = getPrisma();

  constructor(
    @InjectQueue('extraction') private readonly extractionQueue: Queue,
    @InjectQueue('ai-analysis') private readonly aiAnalysisQueue: Queue,
    @InjectQueue('embeddings') private readonly embeddingsQueue: Queue,
    private readonly dedupService: DeduplicationService,
  ) {}

  async create(dto: SaveResourceDto, userId: string) {
    if (dto.url) {
      const dup = await this.dedupService.checkUrlDuplicate(userId, dto.url);
      if (dup.exists) {
        const existing = await this.findById(dup.resourceId!, userId);
        return { data: existing, duplicate: true, duplicateOf: dup.resourceId! };
      }
    }

    const hasContent = Boolean(dto.html || dto.markdown);
    const needsExtraction = Boolean(dto.url) && !hasContent;

    const resource = await this.prisma.resource.create({
      data: {
        url: dto.url,
        title: dto.title ?? null,
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
        resourceType: 'website',
        userId,
        status: hasContent ? 'COMPLETED' : needsExtraction ? 'PROCESSING' : 'PENDING',
        content:
          dto.html || dto.markdown
            ? {
                create: {
                  rawHtml: dto.html ?? null,
                  markdown: dto.markdown ?? null,
                  cleanText: dto.selectedText ?? null,
                },
              }
            : undefined,
      },
      include: {
        content: true,
      },
    });

    if (needsExtraction) {
      await this.extractionQueue.add('extract', { resourceId: resource.id });
      this.logger.log(`Queued extraction for resource ${resource.id}`);
    }

    if (dto.projectIds?.length) {
      await this.linkProjects(resource.id, dto.projectIds, userId);
    }

    if (dto.collectionIds?.length) {
      await this.linkCollections(resource.id, dto.collectionIds, userId);
    }

    return this.findById(resource.id, userId);
  }

  private async linkProjects(resourceId: string, projectIds: string[], userId: string) {
    const owned = await this.prisma.project.findMany({
      where: { userId, id: { in: projectIds } },
      select: { id: true },
    });
    for (const project of owned) {
      await this.prisma.resourceProject.upsert({
        where: { resourceId_projectId: { resourceId, projectId: project.id } },
        update: {},
        create: { resourceId, projectId: project.id },
      });
    }
  }

  private async linkCollections(resourceId: string, collectionIds: string[], userId: string) {
    const owned = await this.prisma.collection.findMany({
      where: { userId, id: { in: collectionIds } },
      select: { id: true },
    });
    for (const collection of owned) {
      await this.prisma.resourceCollection.upsert({
        where: { resourceId_collectionId: { resourceId, collectionId: collection.id } },
        update: {},
        create: { resourceId, collectionId: collection.id },
      });
    }
  }

  async findAll(query: ResourceQueryDto, userId: string) {
    const {
      cursor,
      pageSize = 20,
      search,
      category,
      tag,
      projectId,
      collectionId,
      sortBy = 'savedAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.ResourceWhereInput = { userId, status: { not: 'DUPLICATE' } };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.aiAnalysis = { category };
    }

    if (tag) {
      where.tags = { some: { tag: { name: tag } } };
    }

    if (projectId) {
      where.projects = { some: { projectId } };
    }

    if (collectionId) {
      where.collections = { some: { collectionId } };
    }

    let cursorValid = false;
    if (cursor) {
      const existing = await this.prisma.resource.findFirst({
        where: { id: cursor, userId },
        select: { id: true },
      });
      cursorValid = Boolean(existing);
    }

    const orderBy = [{ [sortBy]: sortOrder }, { id: sortOrder }] as Prisma.ResourceOrderByWithRelationInput[];

    const [rows, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        orderBy,
        ...(cursorValid ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: pageSize + 1,
        select: {
          id: true,
          url: true,
          title: true,
          description: true,
          resourceType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          savedAt: true,
          tags: { include: { tag: { select: { id: true, name: true } } } },
          projects: {
            include: { project: { select: { id: true, name: true, color: true } } },
          },
          collections: {
            include: { collection: { select: { id: true, name: true, isAuto: true } } },
          },
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? data[data.length - 1]!.id : null;

    return {
      data,
      meta: { total, pageSize, nextCursor, hasMore },
    };
  }

  async findById(id: string, userId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, userId },
      include: {
        content: {
          select: { id: true, markdown: true, cleanText: true, extractedAt: true },
        },
        aiAnalysis: true,
        tags: { include: { tag: { select: { id: true, name: true } } } },
        projects: {
          include: { project: { select: { id: true, name: true, color: true } } },
        },
        collections: {
          include: { collection: { select: { id: true, name: true, isAuto: true } } },
        },
        entities: { include: { entity: true } },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async findSuggestions(query: ResourceQueryDto, userId: string) {
    const { cursor, pageSize = 20 } = query;

    const where: Prisma.ResourceWhereInput = {
      userId,
      aiAnalysis: { duplicateOf: { not: null } },
    };

    let cursorValid = false;
    if (cursor) {
      const existing = await this.prisma.resource.findFirst({
        where: { id: cursor, userId, aiAnalysis: { duplicateOf: { not: null } } },
        select: { id: true },
      });
      cursorValid = Boolean(existing);
    }

    const orderBy = [{ savedAt: 'desc' }, { id: 'desc' }] as Prisma.ResourceOrderByWithRelationInput[];

    const [rows, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        orderBy,
        ...(cursorValid ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: pageSize + 1,
        select: {
          id: true,
          url: true,
          title: true,
          description: true,
          resourceType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          savedAt: true,
          aiAnalysis: { select: { duplicateOf: true, duplicateConfidence: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
          projects: {
            include: { project: { select: { id: true, name: true, color: true } } },
          },
          collections: {
            include: { collection: { select: { id: true, name: true, isAuto: true } } },
          },
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

    const hasMore = rows.length > pageSize;
    const page = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    const candidateIds = [
      ...new Set(
        page
          .map((r) => r.aiAnalysis?.duplicateOf)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const candidates = candidateIds.length
      ? await this.prisma.resource.findMany({
          where: { id: { in: candidateIds }, userId },
          select: { id: true, title: true, url: true, savedAt: true, status: true },
        })
      : [];

    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    const data = page.map((r) => ({
      duplicate: {
        id: r.id,
        url: r.url,
        title: r.title,
        description: r.description,
        resourceType: r.resourceType,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        savedAt: r.savedAt,
        tags: r.tags,
        projects: r.projects,
        collections: r.collections,
      },
      candidate: candidateMap.get(r.aiAnalysis?.duplicateOf ?? ''),
      confidence: r.aiAnalysis?.duplicateConfidence ?? null,
    }));

    return {
      data,
      meta: { total, pageSize, nextCursor, hasMore },
    };
  }

  async merge(duplicateId: string, canonicalId: string, userId: string) {
    const duplicate = await this.prisma.resource.findFirst({
      where: { id: duplicateId, userId },
      include: { content: true, aiAnalysis: true, embedding: { select: { id: true } } },
    });
    const canonical = await this.prisma.resource.findFirst({
      where: { id: canonicalId, userId },
      include: {
        content: { select: { id: true } },
        aiAnalysis: { select: { id: true } },
        embedding: { select: { id: true } },
      },
    });

    if (!duplicate || !canonical) {
      throw new NotFoundException('Resource not found');
    }
    if (duplicate.id === canonical.id) {
      throw new BadRequestException('Cannot merge a resource with itself');
    }
    if (canonical.status === 'DUPLICATE') {
      throw new BadRequestException('The canonical resource must not be marked as a duplicate');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.resource.update({
        where: { id: canonicalId },
        data: {
          url: canonical.url ?? duplicate.url,
          title: canonical.title ?? duplicate.title,
          description: canonical.description ?? duplicate.description,
          ...(canonical.resourceType === 'website' && duplicate.resourceType !== 'website'
            ? { resourceType: duplicate.resourceType }
            : {}),
          ...(canonical.metadata == null && duplicate.metadata != null
            ? { metadata: duplicate.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      if (duplicate.content && !canonical.content) {
        await tx.resourceContent.update({
          where: { id: duplicate.content.id },
          data: { resourceId: canonicalId },
        });
      }

      if (duplicate.aiAnalysis) {
        if (!canonical.aiAnalysis) {
          await tx.aIAnalysis.update({
            where: { id: duplicate.aiAnalysis.id },
            data: { resourceId: canonicalId, duplicateOf: null, duplicateConfidence: null },
          });
        } else {
          await tx.aIAnalysis.delete({ where: { id: duplicate.aiAnalysis.id } });
        }
      }

      if (duplicate.embedding && !canonical.embedding) {
        await tx.embedding.update({
          where: { id: duplicate.embedding.id },
          data: { resourceId: canonicalId },
        });
      }

      const [dupProjects, dupCollections, dupTags, dupEntities] = await Promise.all([
        tx.resourceProject.findMany({ where: { resourceId: duplicateId }, select: { projectId: true } }),
        tx.resourceCollection.findMany({ where: { resourceId: duplicateId }, select: { collectionId: true } }),
        tx.resourceTag.findMany({ where: { resourceId: duplicateId }, select: { tagId: true } }),
        tx.resourceEntity.findMany({ where: { resourceId: duplicateId }, select: { entityId: true } }),
      ]);

      for (const { projectId } of dupProjects) {
        await tx.resourceProject.upsert({
          where: { resourceId_projectId: { resourceId: canonicalId, projectId } },
          update: {},
          create: { resourceId: canonicalId, projectId },
        });
      }
      for (const { collectionId } of dupCollections) {
        await tx.resourceCollection.upsert({
          where: { resourceId_collectionId: { resourceId: canonicalId, collectionId } },
          update: {},
          create: { resourceId: canonicalId, collectionId },
        });
      }
      for (const { tagId } of dupTags) {
        await tx.resourceTag.upsert({
          where: { resourceId_tagId: { resourceId: canonicalId, tagId } },
          update: {},
          create: { resourceId: canonicalId, tagId },
        });
      }
      for (const { entityId } of dupEntities) {
        await tx.resourceEntity.upsert({
          where: { resourceId_entityId: { resourceId: canonicalId, entityId } },
          update: {},
          create: { resourceId: canonicalId, entityId },
        });
      }

      const rels = await tx.relationship.findMany({
        where: { OR: [{ sourceId: duplicateId }, { targetId: duplicateId }] },
        select: { id: true, sourceId: true, targetId: true, type: true, confidence: true },
      });

      for (const rel of rels) {
        const source = rel.sourceId === duplicateId ? canonicalId : rel.sourceId;
        const target = rel.targetId === duplicateId ? canonicalId : rel.targetId;
        const [a, b] = [source, target].sort() as [string, string];

        if (a === b) {
          await tx.relationship.delete({ where: { id: rel.id } });
          continue;
        }

        const existing = await tx.relationship.findUnique({
          where: { sourceId_targetId_type: { sourceId: a, targetId: b, type: rel.type } },
        });

        if (existing && existing.id !== rel.id) {
          const confidence = Math.max(existing.confidence ?? 0, rel.confidence ?? 0);
          await tx.relationship.delete({ where: { id: rel.id } });
          if (confidence !== existing.confidence) {
            await tx.relationship.update({
              where: { id: existing.id },
              data: { confidence },
            });
          }
        } else {
          await tx.relationship.update({
            where: { id: rel.id },
            data: { sourceId: a, targetId: b },
          });
        }
      }

      await tx.snapshot.updateMany({
        where: { resourceId: duplicateId },
        data: { resourceId: canonicalId },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'MERGE',
          entityType: 'Resource',
          entityId: canonicalId,
          metadata: { duplicateId },
        },
      });

      await tx.resource.delete({ where: { id: duplicateId } });
    });

    this.logger.log(`Merged resource ${duplicateId} into ${canonicalId}`);

    return this.findById(canonicalId, userId);
  }

  async retry(id: string, userId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, userId },
      include: {
        content: { select: { id: true, cleanText: true, markdown: true } },
        aiAnalysis: { select: { id: true, reasoning: true } },
        embedding: { select: { id: true } },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    if (resource.status !== 'FAILED') {
      throw new BadRequestException('Resource is not in a failed state');
    }

    const hasContent = Boolean(resource.content?.cleanText ?? resource.content?.markdown);
    const analysisFailed =
      !resource.aiAnalysis || (resource.aiAnalysis.reasoning ?? '').startsWith('FAILED');
    const hasEmbedding = Boolean(resource.embedding);

    let queue: Queue | undefined;
    let jobName: string | undefined;

    if (hasContent) {
      if (analysisFailed) {
        queue = this.aiAnalysisQueue;
        jobName = 'analyze';
      } else if (!hasEmbedding) {
        queue = this.embeddingsQueue;
        jobName = 'embeddings';
      }
    } else if (resource.url) {
      queue = this.extractionQueue;
      jobName = 'extract';
    }

    if (!queue || !jobName) {
      throw new BadRequestException('Nothing to retry');
    }

    await this.prisma.resource.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    await queue.add(jobName, { resourceId: id });
    this.logger.log(`Retried resource ${id} (queued ${jobName})`);

    return this.findById(id, userId);
  }

  async update(id: string, dto: UpdateResourceDto, userId: string) {
    const existing = await this.prisma.resource.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    const updateData: Prisma.ResourceUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata as Prisma.InputJsonValue;

    if (dto.tags !== undefined) {
      await this.prisma.resourceTag.deleteMany({ where: { resourceId: id } });

      for (const tagName of dto.tags) {
        const tag = await this.prisma.tag.upsert({
          where: { name_userId: { name: tagName, userId } },
          update: {},
          create: { name: tagName, userId },
        });
        await this.prisma.resourceTag.create({
          data: { resourceId: id, tagId: tag.id },
        });
      }
    }

    return this.prisma.resource.update({
      where: { id },
      data: updateData,
      include: {
        content: {
          select: { id: true, markdown: true, cleanText: true, extractedAt: true },
        },
        aiAnalysis: true,
        tags: { include: { tag: { select: { id: true, name: true } } } },
        projects: {
          include: { project: { select: { id: true, name: true, color: true } } },
        },
        collections: {
          include: { collection: { select: { id: true, name: true, isAuto: true } } },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.resource.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    await this.prisma.resource.delete({ where: { id } });
  }
}
