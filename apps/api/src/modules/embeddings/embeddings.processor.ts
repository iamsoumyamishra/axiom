import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { getPrisma } from '@axiom/data';
import { EmbeddingsService } from './embeddings.service';
import { DeduplicationService } from '../deduplication/deduplication.service';

@Processor('embeddings')
export class EmbeddingsProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingsProcessor.name);
  private readonly prisma = getPrisma();

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly dedupService: DeduplicationService,
  ) {
    super();
  }

  async process(job: Job<{ resourceId: string }>): Promise<void> {
    const { resourceId } = job.data;

    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { content: true },
    });

    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    const cleanText = resource.content?.cleanText ?? resource.content?.markdown ?? null;
    if (!cleanText) {
      this.logger.warn(`No content to embed for resource ${resourceId}`);
      return;
    }

    const { dimensions, model } = await this.embeddingsService.generateAndStore(resourceId, cleanText);

    this.logger.log(`Embeddings generated for resource ${resourceId} (${model}, ${dimensions} dims)`);

    const dedupResult = await this.dedupService.checkSemanticDuplicate(resourceId, resource.userId);

    if (dedupResult?.action === 'duplicate') {
      this.logger.log(`Resource ${resourceId} is a duplicate of ${dedupResult.duplicateOf}`);
    } else if (dedupResult?.action === 'flag') {
      this.logger.log(`Resource ${resourceId} may be similar to ${dedupResult.duplicateOf} (confidence: ${dedupResult.confidence.toFixed(4)})`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Embeddings job completed for resource ${job.data.resourceId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Embeddings job failed for resource ${job.data.resourceId}: ${error.message}`);
  }
}
