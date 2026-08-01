import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrisma } from '@axiom/data';
import type { CreateProjectDto, UpdateProjectDto } from '@axiom/shared';
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
export class ProjectsService {
  private readonly prisma = getPrisma();

  async create(dto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? null,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { resources: true } } },
    });
  }

  async findById(id: string, userId: string, page = 1, pageSize = 50) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { _count: { select: { resources: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [resources, total] = await Promise.all([
      this.prisma.resourceProject.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { resource: { select: RESOURCE_SELECT } },
      }),
      this.prisma.resourceProject.count({ where: { projectId: id } }),
    ]);

    return {
      ...project,
      resources: resources.map((rp) => rp.resource),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.ensureOwned(id, userId);

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;

    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    await this.ensureOwned(id, userId);
    await this.prisma.project.delete({ where: { id } });
  }

  async addResource(projectId: string, resourceId: string, userId: string) {
    await this.ensureOwned(projectId, userId);
    await this.ensureResourceOwned(resourceId, userId);

    return this.prisma.resourceProject.upsert({
      where: { resourceId_projectId: { resourceId, projectId } },
      update: {},
      create: { resourceId, projectId },
    });
  }

  async removeResource(projectId: string, resourceId: string, userId: string) {
    await this.ensureOwned(projectId, userId);

    try {
      await this.prisma.resourceProject.delete({
        where: { resourceId_projectId: { resourceId, projectId } },
      });
    } catch {
      // Not linked; idempotent remove
    }
  }

  private async ensureOwned(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
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
