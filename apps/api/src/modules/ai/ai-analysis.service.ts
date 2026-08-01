import { Injectable, Logger, Inject } from '@nestjs/common';
import { LlmProvider, LlmError, LlmErrorType } from './providers/llm-provider.interface';
import type { ProviderConfig } from './providers/provider-registry';
import { buildAnalysisPrompt, type AnalysisInput } from './prompts/analysis.prompt';
import { aiResponseSchema, type AiResponse } from './prompts/ai-response.schema';
import {
  LLM_PRIMARY_PROVIDER,
  LLM_PRIMARY_CONFIG,
  LLM_FALLBACK_PROVIDER,
  LLM_FALLBACK_CONFIG,
} from './tokens';

const MAX_CONTENT_CHARS = 80_000;
const RETRY_TRUNCATION_CHARS = 15_000;

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    @Inject(LLM_PRIMARY_PROVIDER) private readonly primaryProvider: LlmProvider,
    @Inject(LLM_PRIMARY_CONFIG) private readonly primaryConfig: ProviderConfig | null,
    @Inject(LLM_FALLBACK_PROVIDER) private readonly fallbackProvider: LlmProvider | null,
    @Inject(LLM_FALLBACK_CONFIG) private readonly fallbackConfig: ProviderConfig | null,
  ) {}

  async analyze(input: AnalysisInput): Promise<{
    result: AiResponse;
    model: string;
    provider: string;
  }> {
    const config = this.primaryConfig;
    if (!config) {
      throw new LlmError(
        'AI analysis is not configured. Set LLM_API_KEY in your .env file.',
        LlmErrorType.NOT_CONFIGURED,
      );
    }

    const truncatedContent = input.content.slice(0, MAX_CONTENT_CHARS);

    const prompt = buildAnalysisPrompt({
      ...input,
      content: truncatedContent,
    });

    try {
      return await this.callProvider(this.primaryProvider, config, prompt);
    } catch (error) {
      if (error instanceof LlmError && error.type === LlmErrorType.TOKEN_LIMIT_EXCEEDED) {
        return this.handleTokenLimit(input, truncatedContent, config);
      }
      throw error;
    }
  }

  private async callProvider(
    provider: LlmProvider,
    config: ProviderConfig,
    prompt: string,
  ): Promise<{ result: AiResponse; model: string; provider: string }> {
    const result = await provider.completeStructured(prompt, aiResponseSchema, {
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });

    return {
      result,
      model: config.model,
      provider: provider.name,
    };
  }

  private async handleTokenLimit(
    input: AnalysisInput,
    alreadyTruncated: string,
    config: ProviderConfig,
  ): Promise<{ result: AiResponse; model: string; provider: string }> {
    this.logger.warn('Token limit exceeded, retrying with aggressive truncation');

    const truncatedContent = alreadyTruncated.slice(0, RETRY_TRUNCATION_CHARS);

    const prompt = buildAnalysisPrompt({
      ...input,
      content: truncatedContent + '\n\n[Note: Content was truncated due to length.]',
    });

    try {
      return await this.callProvider(this.primaryProvider, config, prompt);
    } catch (error) {
      if (error instanceof LlmError && error.type === LlmErrorType.TOKEN_LIMIT_EXCEEDED && this.fallbackProvider && this.fallbackConfig) {
        return this.tryFallback(input, this.fallbackProvider, this.fallbackConfig);
      }
      throw error;
    }
  }

  private async tryFallback(
    input: AnalysisInput,
    provider: LlmProvider,
    config: ProviderConfig,
  ): Promise<{ result: AiResponse; model: string; provider: string }> {
    this.logger.warn(`Falling back to provider: ${provider.name}, model: ${config.model}`);

    const truncatedContent = input.content.slice(0, MAX_CONTENT_CHARS);
    const prompt = buildAnalysisPrompt({
      ...input,
      content: truncatedContent,
    });

    return this.callProvider(provider, config, prompt);
  }
}
