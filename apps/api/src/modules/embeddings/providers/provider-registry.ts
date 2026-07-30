import { EmbeddingProvider } from './embedding-provider.interface';
import { OpenAICompatibleEmbeddingProvider } from './openai-compatible.provider';

export interface EmbeddingProviderConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions: number;
}

export class NullEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'null';

  async generate(): Promise<{
    embeddings: number[][];
    model: string;
    usage: { promptTokens: number };
  }> {
    throw Object.assign(
      new Error('Embedding provider not configured. Set EMBEDDING_API_KEY in your environment.'),
      { code: 'NOT_CONFIGURED' },
    );
  }
}

export function createEmbeddingProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  if (!config.apiKey) {
    return new NullEmbeddingProvider();
  }

  switch (config.provider) {
    case 'openai-compatible':
      return new OpenAICompatibleEmbeddingProvider(config);
    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}
