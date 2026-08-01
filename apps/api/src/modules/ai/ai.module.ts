import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisProcessor } from './ai-analysis.processor';
import { createProvidersFromEnv } from './providers/provider-registry';
import { CollectionsModule } from '../collections/collections.module';
import {
  LLM_PRIMARY_PROVIDER,
  LLM_PRIMARY_CONFIG,
  LLM_FALLBACK_PROVIDER,
  LLM_FALLBACK_CONFIG,
} from './tokens';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ai-analysis' }),
    CollectionsModule,
  ],
  providers: [
    {
      provide: LLM_PRIMARY_PROVIDER,
      useFactory: () => createProvidersFromEnv().primary,
    },
    {
      provide: LLM_PRIMARY_CONFIG,
      useFactory: () => createProvidersFromEnv().primaryConfig,
    },
    {
      provide: LLM_FALLBACK_PROVIDER,
      useFactory: () => createProvidersFromEnv().fallback,
    },
    {
      provide: LLM_FALLBACK_CONFIG,
      useFactory: () => createProvidersFromEnv().fallbackConfig,
    },
    AiAnalysisService,
    AiAnalysisProcessor,
  ],
  exports: [AiAnalysisService],
})
export class AiModule {}
