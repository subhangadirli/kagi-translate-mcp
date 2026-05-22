import { z } from "zod";
import { debug, warn, error as logError } from "../logging.js";
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
    detected_language: z
      .object({
        iso: z.string().optional(),
        label: z.string().optional(),
      })
      .optional(),
    definition: z.record(z.unknown()).optional(),
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
  .passthrough()
  .refine(
    (obj) =>
      Boolean(
        obj.translation ||
          (obj.translations && Array.isArray(obj.translations) && obj.translations.length > 0) ||
          obj.translated_text ||
          obj.translated_url ||
          (obj.items && Array.isArray(obj.items) && obj.items.length > 0)
      ),
    {
      message: "Response missing translation fields",
    }
  );

const kagiProofreadResponseSchema = z
  .object({
    text: z.string().optional(),
    proofread: z.string().optional(),
    corrected_text: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
  })
  .passthrough()
  .refine((obj) => Boolean(obj.corrected_text || obj.proofread || obj.text), {
    message: "Response missing proofread fields",
  });

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
          const normalizedError = parsedJson.success ? this.normalizeKagiError(parsedJson.data) : { message: `Kagi request failed with status ${response.status}`, body: null };
          const bodyErr = normalizedError.body;
          const message = normalizedError.message;
          const apiError = new KagiApiError(message, response.status, bodyErr);
          const requestMeta = this.summarizeRequest(path, body);

          if (this.isRetryableStatus(response.status) && attempt < maxRetries) {
            lastError = apiError;
            warn(`Transient Kagi API error, will retry`, { ...requestMeta, path, status: response.status, attempt, message: apiError.message });
            await this.delayWithJitter(baseDelayMs * Math.pow(2, attempt));
            continue;
          }

          logError(`Kagi API error`, { ...requestMeta, path, status: response.status, message: apiError.message });
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
        const requestMeta = this.summarizeRequest(path, body);

        if (error instanceof KagiApiError || error instanceof KagiResponseError) {
          throw error;
        }

        // Retry only transport-level failures such as fetch and connection errors.
        if (error instanceof Error && attempt < maxRetries) {
          warn(`Network error talking to Kagi, will retry`, { ...requestMeta, path, attempt, error: String(error) });
          await this.delayWithJitter(baseDelayMs * Math.pow(2, attempt));
          continue;
        }

        logError(`Network error talking to Kagi`, { ...requestMeta, path, error: String(error) });

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

  private normalizeKagiError(data: unknown): { message: string; body: KagiApiErrorBody | null } {
    if (!data || typeof data !== "object") {
      return { message: "Kagi request failed", body: null };
    }

    try {
      const parsed = errorBodySchema.parse(data) as KagiApiErrorBody;

      // Prefer explicit message fields, but fall back to other known shapes.
      let message = parsed.message ?? parsed.error ?? parsed.detail ?? null;

      // If `details` is a short string, include it if no other message present.
      if (!message && typeof parsed.details === "string") {
        message = parsed.details;
      }

      // Handle nested shapes like { error: { message: "..." } }
      if (!message && (data as Record<string, unknown>).error && typeof (data as Record<string, unknown>).error === "object") {
        const nested = (data as Record<string, unknown>).error as Record<string, unknown>;
        if (typeof nested.message === "string") {
          message = nested.message;
        }
      }

      if (!message) {
        // Fallback to a compact JSON representation so callers still get something useful.
        try {
          message = JSON.stringify(parsed).slice(0, 200);
        } catch {
          message = "Kagi request failed";
        }
      }

      return { message, body: parsed };
    } catch {
      return { message: "Kagi request failed", body: null };
    }
  }

  private summarizeRequest(path: string, body: object): Record<string, unknown> {
    const request = body as Record<string, unknown>;
    const meta: Record<string, unknown> = { endpoint: path };

    if (typeof request.source_lang === "string") meta.source_lang = request.source_lang;
    if (typeof request.target_lang === "string") meta.target_lang = request.target_lang;
    if (typeof request.text === "string") meta.hasText = true;
    if (Array.isArray(request.texts)) meta.textCount = request.texts.length;
    if (typeof request.url === "string") meta.hasUrl = true;
    if (typeof request.language === "string") meta.language = request.language;

    return meta;
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
