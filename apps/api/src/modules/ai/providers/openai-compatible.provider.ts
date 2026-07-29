import { ZodSchema } from 'zod';
import { LlmProvider, LlmOptions, LlmError, LlmErrorType } from './llm-provider.interface';

export interface OpenAiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai-compatible';

  constructor(private readonly config: OpenAiConfig) {}

  async completeStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: LlmOptions,
  ): Promise<T> {
    const body = {
      model: options?.model ?? this.config.model,
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: 'json_object' as const },
    };

    const response = await fetch(
      `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw this.classifyError(response, await response.text().catch(() => ''));
    }

    const json = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new LlmError(
        'LLM returned empty response',
        LlmErrorType.INVALID_RESPONSE,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new LlmError(
        'Failed to parse LLM response as JSON',
        LlmErrorType.INVALID_RESPONSE,
        content,
      );
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new LlmError(
        `LLM response failed validation: ${result.error.message}`,
        LlmErrorType.INVALID_RESPONSE,
        { content, errors: result.error.issues },
      );
    }

    return result.data;
  }

  private classifyError(response: Response, body: string): LlmError {
    const message = `LLM request failed (${response.status}): ${body}`;

    switch (response.status) {
      case 401:
        return new LlmError(message, LlmErrorType.AUTHENTICATION_ERROR, { status: 401, body });
      case 429:
        return new LlmError(message, LlmErrorType.RATE_LIMITED, { status: 429, body });
      case 400: {
        const isTokenLimit =
          body.includes('context_length_exceeded') ||
          body.includes('maximum context length') ||
          body.includes('token limit') ||
          body.includes('too many tokens');
        if (isTokenLimit) {
          return new LlmError(message, LlmErrorType.TOKEN_LIMIT_EXCEEDED, { status: 400, body });
        }
        break;
      }
      case 402:
      case 403: {
        const isQuota =
          body.includes('quota') ||
          body.includes('insufficient') ||
          body.includes('billing') ||
          body.includes('credit');
        if (isQuota) {
          return new LlmError(message, LlmErrorType.INSUFFICIENT_QUOTA, { status: response.status, body });
        }
        break;
      }
    }

    return new LlmError(message, LlmErrorType.UNKNOWN, { status: response.status, body });
  }
}
