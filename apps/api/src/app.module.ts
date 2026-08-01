import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { AiModule } from './modules/ai/ai.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { SearchModule } from './modules/search/search.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    BullModule.forRoot({
      connection: (() => {
        if (process.env['REDIS_URL']) {
          const url = new URL(process.env['REDIS_URL']);
          return {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
          };
        }
        return {
          host: process.env['REDIS_HOST'] ?? 'localhost',
          port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
        };
      })(),
    }),
    HealthModule,
    AuthModule,
    ResourcesModule,
    AiModule,
    EmbeddingsModule,
    SearchModule,
    ProjectsModule,
    CollectionsModule,
    DashboardModule,
    RelationshipsModule,
  ],
})
export class AppModule {}
