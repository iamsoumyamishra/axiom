import { ZodSchema } from 'zod';

export enum LlmErrorType {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly type: LlmErrorType,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

export interface LlmOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmProvider {
  readonly name: string;
  completeStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: LlmOptions,
  ): Promise<T>;
}
