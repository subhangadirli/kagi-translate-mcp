import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KagiApiError, KagiNetworkError, KagiResponseError } from "../kagi/client.js";
import type { KagiClient } from "../kagi/client.js";
import type { KagiTranslationResponse } from "../kagi/types.js";

export const translateUrlInputSchema = z.object({
  url: z.string().url(),
  source_lang: z.string().min(1),
  target_lang: z.string().min(1),
  formality: z.enum(["default", "formal", "informal"]).optional(),
  gender: z.enum(["neutral", "female", "male"]).optional(),
});

export type TranslateUrlInput = z.infer<typeof translateUrlInputSchema>;

function formatTranslationResponse(response: KagiTranslationResponse): string {
  if (response.translated_url) {
    return response.translated_url;
  }

  if (response.translation) {
    return response.translation;
  }

  if (response.translated_text) {
    return response.translated_text;
  }

  return JSON.stringify(response, null, 2);
}

function formatToolError(error: unknown): string {
  if (error instanceof KagiApiError) {
    return `Kagi API error (${error.status}): ${error.message}`;
  }

  if (error instanceof KagiNetworkError) {
    return `Network error talking to Kagi: ${error.message}`;
  }

  if (error instanceof KagiResponseError) {
    return `Unexpected Kagi response: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown URL translation error";
}

export function registerTranslateUrlTool(server: McpServer, client: KagiClient): void {
  server.registerTool(
    "translate_url",
    {
      description: "Translate the content of a URL using Kagi Translate.",
      inputSchema: translateUrlInputSchema,
    },
    async (input) => {
      try {
        const response = await client.translateUrl({
          url: input.url,
          source_lang: input.source_lang,
          target_lang: input.target_lang,
          ...(input.formality ? { formality: input.formality } : {}),
          ...(input.gender ? { gender: input.gender } : {}),
        });

        return {
          content: [
            {
              type: "text",
              text: formatTranslationResponse(response),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: formatToolError(error),
            },
          ],
        };
      }
    }
  );
}
