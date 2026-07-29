import { ZodSchema } from 'zod';
import { LlmProvider, LlmError, LlmErrorType, type LlmOptions } from './llm-provider.interface';
import { OpenAiCompatibleProvider, type OpenAiConfig } from './openai-compatible.provider';

export interface ProviderConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class NullLlmProvider implements LlmProvider {
  readonly name = 'none';

  async completeStructured<T>(_prompt: string, _schema: ZodSchema<T>, _options?: LlmOptions): Promise<T> {
    throw new LlmError(
      'AI analysis is not configured. Set LLM_API_KEY in your .env file.',
      LlmErrorType.NOT_CONFIGURED,
    );
  }
}

function loadProviderConfig(prefix: string): ProviderConfig | null {
  const provider = process.env[`${prefix}PROVIDER`] ?? process.env['LLM_PROVIDER'] ?? 'openai-compatible';
  const baseUrl = process.env[`${prefix}BASE_URL`] ?? process.env['LLM_BASE_URL'] ?? 'https://api.openai.com/v1';
  const apiKey = process.env[`${prefix}API_KEY`] ?? process.env['LLM_API_KEY'] ?? '';
  const model = process.env[`${prefix}MODEL`] ?? process.env['LLM_MODEL'] ?? 'gpt-4o-mini';

  if (!apiKey) return null;

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    maxTokens: parseInt(process.env['LLM_MAX_TOKENS'] ?? '4096', 10),
    temperature: parseFloat(process.env['LLM_TEMPERATURE'] ?? '0.1'),
  };
}

function createProvider(config: ProviderConfig): LlmProvider {
  switch (config.provider) {
    case 'openai-compatible': {
      const openAiConfig: OpenAiConfig = {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      };
      return new OpenAiCompatibleProvider(openAiConfig);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

export function createProvidersFromEnv(): {
  primary: LlmProvider;
  primaryConfig: ProviderConfig | null;
  fallback: LlmProvider | null;
  fallbackConfig: ProviderConfig | null;
} {
  const primaryConfig = loadProviderConfig('LLM_');
  const fallbackConfig = loadProviderConfig('LLM_FALLBACK_');

  if (!primaryConfig) {
    return {
      primary: new NullLlmProvider(),
      primaryConfig: null,
      fallback: null,
      fallbackConfig: null,
    };
  }

  const primary = createProvider(primaryConfig);
  const fallback = fallbackConfig ? createProvider(fallbackConfig) : null;

  return { primary, primaryConfig, fallback, fallbackConfig };
}
