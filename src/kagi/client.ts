import { z } from "zod";
import type {
  KagiApiErrorBody,
  KagiProofreadRequest,
  KagiProofreadResponse,
  KagiTranslateTextRequest,
  KagiTranslateUrlRequest,
  KagiTranslationResponse,
} from "./types.js";

const kagiTranslationResponseSchema = z
  .object({
    translation: z.string().optional(),
    translations: z.array(z.string()).optional(),
    translated_text: z.string().optional(),
    translated_url: z.string().optional(),
    url: z.string().optional(),
    source_lang: z.string().optional(),
    target_lang: z.string().optional(),
    items: z
      .array(
        z.object({
          source: z.string().optional(),
          translation: z.string(),
          detected_source_lang: z.string().optional(),
          target_lang: z.string().optional(),
        })
      )
      .optional(),
  })
  .passthrough();

const kagiProofreadResponseSchema = z
  .object({
    text: z.string().optional(),
    proofread: z.string().optional(),
    corrected_text: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
  })
  .passthrough();

const errorBodySchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
    detail: z.string().optional(),
    details: z.unknown().optional(),
  })
  .passthrough();

export class KagiNetworkError extends Error {
  override name = "KagiNetworkError";
}

export class KagiApiError extends Error {
  readonly status: number;
  readonly body: KagiApiErrorBody | null;

  constructor(message: string, status: number, body: KagiApiErrorBody | null) {
    super(message);
    this.name = "KagiApiError";
    this.status = status;
    this.body = body;
  }
}

export class KagiResponseError extends Error {
  override name = "KagiResponseError";
}

export class KagiClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://translate.kagi.com"
  ) {}

  async translateText(request: KagiTranslateTextRequest): Promise<KagiTranslationResponse> {
    return this.postJson<KagiTranslationResponse>("/api/translate", request, kagiTranslationResponseSchema);
  }

  async translateUrl(request: KagiTranslateUrlRequest): Promise<KagiTranslationResponse> {
    return this.postJson<KagiTranslationResponse>("/api/translate-url", request, kagiTranslationResponseSchema);
  }

  async proofread(request: KagiProofreadRequest): Promise<KagiProofreadResponse> {
    return this.postJson<KagiProofreadResponse>("/api/proofread", request, kagiProofreadResponseSchema);
  }

  private async postJson<T>(
    path: string,
    body: object,
    schema: z.ZodTypeAny,
    maxRetries = 3,
    baseDelayMs = 500
  ): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const responseText = await response.text();
        const parsedJson = this.parseJson(responseText);

        if (!response.ok) {
          const bodyErr = parsedJson.success ? (errorBodySchema.parse(parsedJson.data) as KagiApiErrorBody) : null;
          const message = bodyErr?.message ?? bodyErr?.error ?? bodyErr?.detail ?? `Kagi request failed with status ${response.status}`;
          const apiError = new KagiApiError(message, response.status, bodyErr);

          if (this.isRetryableStatus(response.status) && attempt < maxRetries) {
            lastError = apiError;
            await this.delayWithJitter(baseDelayMs * Math.pow(2, attempt));
            continue;
          }

          throw apiError;
        }

        if (!parsedJson.success) {
          throw new KagiResponseError(`Kagi returned invalid JSON from ${path}`);
        }

        const parsed = schema.safeParse(parsedJson.data);
        if (!parsed.success) {
          throw new KagiResponseError(`Kagi returned an unexpected response shape from ${path}`);
        }

        return parsed.data as T;
      } catch (error) {
        lastError = error;

        // On non-api network errors, retry up to maxRetries
        if (attempt < maxRetries) {
          await this.delayWithJitter(baseDelayMs * Math.pow(2, attempt));
          continue;
        }

        if (error instanceof Error) {
          throw new KagiNetworkError(this.describeError(error));
        }

        throw new KagiNetworkError(String(error));
      }
    }

    if (lastError instanceof KagiApiError) throw lastError;
    if (lastError instanceof Error) throw new KagiNetworkError(this.describeError(lastError));
    throw new KagiNetworkError("Unknown network error");
  }

  private isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private async delayWithJitter(ms: number): Promise<void> {
    const jitter = Math.random() * Math.max(0, ms * 0.1);
    await new Promise((resolve) => setTimeout(resolve, Math.round(ms + jitter)));
  }

  private parseJson(responseText: string): { success: true; data: unknown } | { success: false } {
    try {
      return { success: true, data: JSON.parse(responseText) as unknown };
    } catch {
      return { success: false };
    }
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown network error";
  }
}
