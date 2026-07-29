import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { getPrisma } from '@axiom/data';
import type { Prisma } from '@prisma/client';
import { ExtractionService } from './extraction.service';

@Processor('extraction')
export class ExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractionProcessor.name);
  private readonly prisma = getPrisma();

  constructor(private readonly extractionService: ExtractionService) {
    super();
  }

  async process(job: Job<{ resourceId: string }>): Promise<void> {
    const { resourceId } = job.data;

    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    if (!resource.url) {
      await this.prisma.resource.update({
        where: { id: resourceId },
        data: { status: 'FAILED' },
      });
      return;
    }

    const extracted = await this.extractionService.fetchAndExtract(resource.url);

    await this.prisma.resourceContent.upsert({
      where: { resourceId },
      create: {
        resourceId,
        rawHtml: extracted.rawHtml,
        markdown: extracted.markdown,
        cleanText: extracted.cleanText,
        extractedAt: new Date(),
      },
      update: {
        rawHtml: extracted.rawHtml,
        markdown: extracted.markdown,
        cleanText: extracted.cleanText,
        extractedAt: new Date(),
      },
    });

    const metadata: Record<string, unknown> = {
      ...((resource.metadata as Record<string, unknown>) ?? {}),
      wordCount: extracted.wordCount,
      readingTime: extracted.readingTime,
    };

    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        title: resource.title ?? extracted.title,
        status: 'COMPLETED',
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Extraction completed for resource ${job.data.resourceId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Extraction failed for resource ${job.data.resourceId}: ${error.message}`);
  }
}
