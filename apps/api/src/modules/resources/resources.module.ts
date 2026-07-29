import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ExtractionService } from './extraction/extraction.service';
import { ExtractionProcessor } from './extraction/extraction.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'extraction' },
      { name: 'ai-analysis' },
    ),
  ],
  controllers: [ResourcesController],
  providers: [
    ResourcesService,
    ExtractionService,
    ExtractionProcessor,
  ],
  exports: [ResourcesService],
})
export class ResourcesModule {}
