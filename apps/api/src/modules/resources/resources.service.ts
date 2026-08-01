import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
      page = 1,
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

    const orderBy: Prisma.ResourceOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
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

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
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
