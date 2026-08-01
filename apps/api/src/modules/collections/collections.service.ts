import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import type { CreateCollectionDto, UpdateCollectionDto } from '@axiom/shared';
import type { Prisma } from '@prisma/client';

const RESOURCE_SELECT = {
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
} satisfies Prisma.ResourceSelect;

@Injectable()
export class CollectionsService {
  private readonly prisma = getPrisma();

  async create(dto: CreateCollectionDto, userId: string) {
    return this.prisma.collection.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    const [auto, manual] = await Promise.all([
      this.prisma.collection.findMany({
        where: { userId, isAuto: true },
        orderBy: { name: 'asc' },
        include: { _count: { select: { resources: true } } },
      }),
      this.prisma.collection.findMany({
        where: { userId, isAuto: false },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { resources: true } } },
      }),
    ]);

    return { auto, manual };
  }

  async findById(id: string, userId: string, page = 1, pageSize = 50) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: { _count: { select: { resources: true } } },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const [resources, total] = await Promise.all([
      this.prisma.resourceCollection.findMany({
        where: { collectionId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { resource: { select: RESOURCE_SELECT } },
      }),
      this.prisma.resourceCollection.count({ where: { collectionId: id } }),
    ]);

    return {
      ...collection,
      resources: resources.map((rc) => rc.resource),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async update(id: string, dto: UpdateCollectionDto, userId: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true, isAuto: true },
    });

    if (!existing) {
      throw new NotFoundException('Collection not found');
    }

    if (existing.isAuto) {
      throw new NotFoundException('Auto collections cannot be renamed');
    }

    const data: Prisma.CollectionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.collection.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true, isAuto: true },
    });

    if (!existing) {
      throw new NotFoundException('Collection not found');
    }

    if (existing.isAuto) {
      throw new NotFoundException('Auto collections are managed by Axiom');
    }

    await this.prisma.collection.delete({ where: { id } });
  }

  async addResource(collectionId: string, resourceId: string, userId: string) {
    await this.ensureOwned(collectionId, userId);
    await this.ensureResourceOwned(resourceId, userId);

    return this.prisma.resourceCollection.upsert({
      where: { resourceId_collectionId: { resourceId, collectionId } },
      update: {},
      create: { resourceId, collectionId },
    });
  }

  async removeResource(collectionId: string, resourceId: string, userId: string) {
    await this.ensureOwned(collectionId, userId);

    try {
      await this.prisma.resourceCollection.delete({
        where: { resourceId_collectionId: { resourceId, collectionId } },
      });
    } catch {
      // Not linked; idempotent remove
    }
  }

  /**
   * Materialize auto collections from AI tags. Idempotent.
   * Creates/updates one auto Collection per tag and links every
   * matching resource. Removes auto collections whose tag no longer exists.
   */
  async syncAutoCollections(userId: string) {
    const analyses = await this.prisma.aIAnalysis.findMany({
      where: { resource: { userId } },
      select: { resourceId: true, tags: true },
    });

    const tagToResourceIds = new Map<string, Set<string>>();
    for (const analysis of analyses) {
      for (const tag of analysis.tags) {
        const set = tagToResourceIds.get(tag) ?? new Set<string>();
        set.add(analysis.resourceId);
        tagToResourceIds.set(tag, set);
      }
    }

    const currentTags = new Set(tagToResourceIds.keys());

    const autoCollections = await this.prisma.collection.findMany({
      where: { userId, isAuto: true },
      select: { id: true, name: true },
    });

    // Remove auto collections whose tag no longer exists
    for (const collection of autoCollections) {
      if (!currentTags.has(collection.name)) {
        await this.prisma.collection.delete({ where: { id: collection.id } });
      }
    }

    const created: { tag: string; collectionId: string; resources: number }[] = [];

    for (const [tag, resourceIds] of tagToResourceIds) {
      const collection = await this.ensureAutoCollection(userId, tag);

      for (const resourceId of resourceIds) {
        await this.prisma.resourceCollection.upsert({
          where: { resourceId_collectionId: { resourceId, collectionId: collection.id } },
          update: {},
          create: { resourceId, collectionId: collection.id },
        });
      }

      created.push({ tag, collectionId: collection.id, resources: resourceIds.size });
    }

    return { synced: created.length, collections: created };
  }

  /**
   * Link a single resource to auto collections for its tags (used after AI analysis).
   */
  async syncResourceCollections(resourceId: string, userId: string, tags: string[]) {
    if (tags.length === 0) return;

    for (const tag of tags) {
      const collection = await this.ensureAutoCollection(userId, tag);

      await this.prisma.resourceCollection.upsert({
        where: { resourceId_collectionId: { resourceId, collectionId: collection.id } },
        update: {},
        create: { resourceId, collectionId: collection.id },
      });
    }
  }

  private async ensureAutoCollection(userId: string, name: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { userId, name, isAuto: true },
      select: { id: true },
    });
    if (existing) return existing;

    return this.prisma.collection.create({
      data: { name, isAuto: true, userId },
    });
  }

  private async ensureOwned(id: string, userId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }

  private async ensureResourceOwned(resourceId: string, userId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, userId },
      select: { id: true },
    });
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
  }
}
