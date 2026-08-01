import { Injectable } from '@nestjs/common';
import { getPrisma } from '@axiom/data';

@Injectable()
export class DashboardService {
  private readonly prisma = getPrisma();

  async getOverview(userId: string) {
    const [
      totalResources,
      completed,
      processing,
      totalProjects,
      totalCollections,
      totalTags,
      recent,
      categories,
      tags,
    ] = await Promise.all([
      this.prisma.resource.count({ where: { userId, status: { not: 'DUPLICATE' } } }),
      this.prisma.resource.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.resource.count({ where: { userId, status: 'PROCESSING' } }),
      this.prisma.project.count({ where: { userId } }),
      this.prisma.collection.count({ where: { userId } }),
      this.prisma.tag.count({ where: { userId } }),
      this.prisma.resource.findMany({
        where: { userId, status: { not: 'DUPLICATE' } },
        orderBy: { savedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          url: true,
          title: true,
          resourceType: true,
          status: true,
          savedAt: true,
          aiAnalysis: { select: { category: true, importance: true } },
        },
      }),
      this.prisma.$queryRaw<
        { category: string; count: bigint }[]
      >`
        SELECT a."category" AS "category", COUNT(*)::int AS "count"
        FROM "AIAnalysis" a
        JOIN "Resource" r ON r."id" = a."resourceId"
        WHERE r."userId" = ${userId} AND a."category" IS NOT NULL
        GROUP BY a."category"
        ORDER BY "count" DESC
        LIMIT 8
      `,
      this.prisma.$queryRaw<
        { tag: string; count: number }[]
      >`
        SELECT t."name" AS "tag", COUNT(*)::int AS "count"
        FROM "ResourceTag" rt
        JOIN "Resource" r ON r."id" = rt."resourceId"
        JOIN "Tag" t ON t."id" = rt."tagId"
        WHERE r."userId" = ${userId}
        GROUP BY t."id"
        ORDER BY "count" DESC
        LIMIT 8
      `,
    ]);

    return {
      stats: {
        totalResources,
        completed,
        processing,
        totalProjects,
        totalCollections,
        totalTags,
      },
      recent,
      topCategories: categories,
      topTags: tags,
    };
  }
}
