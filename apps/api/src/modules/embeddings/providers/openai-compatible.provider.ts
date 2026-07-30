import { EmbeddingProvider, EmbeddingError, EmbeddingErrorType } from './embedding-provider.interface';

interface OpenAIEmbeddingResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage: { prompt_tokens: number };
}

export class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;

  constructor(
    private readonly config: {
      baseUrl: string;
      apiKey: string;
      model: string;
      dimensions: number;
    },
  ) {
    this.name = `openai-compatible:${this.config.model}`;
  }

  async generate(inputs: string[]): Promise<{
    embeddings: number[][];
    model: string;
    usage: { promptTokens: number };
  }> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      input: inputs,
    };
    if (this.config.dimensions > 0) {
      body['dimensions'] = this.config.dimensions;
    }

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new EmbeddingError(
        `Network error calling embedding API: ${(err as Error).message}`,
        EmbeddingErrorType.UNKNOWN,
        this.name,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      const errorType = this.classifyError(response.status, errorBody);
      throw new EmbeddingError(
        `Embedding API error (${response.status}): ${errorBody}`,
        errorType,
        this.name,
      );
    }

    let json: OpenAIEmbeddingResponse;
    try {
      json = (await response.json()) as OpenAIEmbeddingResponse;
    } catch (err) {
      throw new EmbeddingError(
        `Invalid embedding API response: ${(err as Error).message}`,
        EmbeddingErrorType.INVALID_RESPONSE,
        this.name,
      );
    }

    if (!Array.isArray(json.data) || json.data.length === 0) {
      throw new EmbeddingError(
        'Embedding API returned empty data',
        EmbeddingErrorType.INVALID_RESPONSE,
        this.name,
      );
    }

    const embeddings = json.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);

    return {
      embeddings,
      model: json.model,
      usage: { promptTokens: json.usage.prompt_tokens },
    };
  }

  private classifyError(status: number, body: string): EmbeddingErrorType {
    if (status === 401) return EmbeddingErrorType.AUTHENTICATION_ERROR;
    if (status === 429) {
      if (body.includes('quota') || body.includes('insufficient')) {
        return EmbeddingErrorType.INSUFFICIENT_QUOTA;
      }
      return EmbeddingErrorType.RATE_LIMITED;
    }
    return EmbeddingErrorType.UNKNOWN;
  }
}
