export enum EmbeddingErrorType {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
}

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly type: EmbeddingErrorType,
    public readonly provider?: string,
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export interface EmbeddingProvider {
  readonly name: string;
  generate(inputs: string[]): Promise<{
    embeddings: number[][];
    model: string;
    usage: { promptTokens: number };
  }>;
}
