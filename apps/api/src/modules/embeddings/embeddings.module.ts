import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingsProcessor } from './embeddings.processor';
import { createEmbeddingProvider } from './providers/provider-registry';
import { DeduplicationService } from '../deduplication/deduplication.service';
import type { EmbeddingProviderConfig } from './providers/provider-registry';

export function embeddingProviderFactory(configService: ConfigService) {
  const config: EmbeddingProviderConfig = {
    provider: configService.get<string>('EMBEDDING_PROVIDER', 'openai-compatible'),
    baseUrl: configService.get<string>('EMBEDDING_BASE_URL', 'https://api.openai.com/v1'),
    apiKey: configService.get<string>('EMBEDDING_API_KEY', ''),
    model: configService.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small'),
    dimensions: configService.get<number>('EMBEDDING_DIMENSIONS', 1536),
  };

  return createEmbeddingProvider(config);
}

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'embeddings' })],
  providers: [
    {
      provide: 'EMBEDDING_PROVIDER',
      useFactory: embeddingProviderFactory,
      inject: [ConfigService],
    },
    EmbeddingsService,
    EmbeddingsProcessor,
    DeduplicationService,
  ],
  exports: [EmbeddingsService, DeduplicationService, BullModule],
})
export class EmbeddingsModule {}
