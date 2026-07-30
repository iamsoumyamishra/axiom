import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { getPrisma } from '@axiom/data';
import { AiAnalysisService } from './ai-analysis.service';
import { LlmError, LlmErrorType } from './providers/llm-provider.interface';
import { LLM_PRIMARY_CONFIG, LLM_FALLBACK_CONFIG } from './tokens';
import type { ProviderConfig } from './providers/provider-registry';

@Processor('ai-analysis')
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);
  private readonly prisma = getPrisma();

  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    @Inject(LLM_PRIMARY_CONFIG) private readonly primaryConfig: ProviderConfig | null,
    @Inject(LLM_FALLBACK_CONFIG) private readonly fallbackConfig: ProviderConfig | null,
    @InjectQueue('embeddings') private readonly embeddingsQueue: Queue,
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
      this.logger.warn(`No content to analyze for resource ${resourceId}`);
      return;
    }

    const wordCount = cleanText.split(/\s+/).length;

    try {
      const { result, model, provider } = await this.aiAnalysisService.analyze({
        title: resource.title,
        url: resource.url,
        content: cleanText,
        wordCount,
      });

      await this.prisma.aIAnalysis.upsert({
        where: { resourceId },
        create: {
          resourceId,
          category: result.category,
          subcategory: result.subcategory ?? null,
          summary: result.summary,
          importance: result.importance,
          qualityScore: result.qualityScore ?? null,
          noveltyScore: result.noveltyScore ?? null,
          difficulty: result.difficulty ?? null,
          readingTime: result.readingTime ?? null,
          tags: result.tags,
          topics: result.topics ?? [],
          keyConcepts: result.keyConcepts ?? [],
          entities: result.entities ?? [],
          model,
          confidence: result.confidence ?? null,
          reasoning: result.reasoning ?? null,
        },
        update: {
          category: result.category,
          subcategory: result.subcategory ?? null,
          summary: result.summary,
          importance: result.importance,
          qualityScore: result.qualityScore ?? null,
          noveltyScore: result.noveltyScore ?? null,
          difficulty: result.difficulty ?? null,
          readingTime: result.readingTime ?? null,
          tags: result.tags,
          topics: result.topics ?? [],
          keyConcepts: result.keyConcepts ?? [],
          entities: result.entities ?? [],
          model,
          confidence: result.confidence ?? null,
          reasoning: result.reasoning ?? null,
        },
      });

      this.logger.log(`AI analysis completed for resource ${resourceId} (${provider}/${model})`);

      await this.embeddingsQueue.add('embeddings', { resourceId });
      this.logger.log(`Embeddings job queued for resource ${resourceId}`);
    } catch (error) {
      const errorMessage = error instanceof LlmError ? error.message : 'AI analysis failed';
      const errorType = error instanceof LlmError ? error.type : LlmErrorType.UNKNOWN;

      this.logger.error(`AI analysis failed for resource ${resourceId}: ${errorMessage}`);

      const modelName = this.primaryConfig?.model ?? 'unknown';

      await this.prisma.aIAnalysis.upsert({
        where: { resourceId },
        create: {
          resourceId,
          model: modelName,
          reasoning: `FAILED: ${errorMessage}`,
        },
        update: {
          reasoning: `FAILED: ${errorMessage}`,
        },
      });

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`AI analysis job completed for resource ${job.data.resourceId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`AI analysis job failed for resource ${job.data.resourceId}: ${error.message}`);
  }
}
