import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KagiApiError, KagiNetworkError, KagiResponseError } from "../kagi/client.js";
import type { KagiClient } from "../kagi/client.js";
import type { KagiTranslationResponse } from "../kagi/types.js";

export const translateTextInputSchema = z
  .object({
    text: z.string().min(1).optional(),
    texts: z.array(z.string().min(1)).min(1).optional(),
    source_lang: z.string().min(1),
    target_lang: z.string().min(1),
    formality: z.enum(["default", "formal", "informal"]).optional(),
    gender: z.enum(["neutral", "female", "male"]).optional(),
    context: z.string().optional(),
  })
  .refine((value) => Boolean(value.text || value.texts), {
    message: "Provide either text or texts",
    path: ["text"],
  })
  .refine((value) => !(value.text && value.texts), {
    message: "Provide only one of text or texts",
    path: ["texts"],
  });

export type TranslateTextInput = z.infer<typeof translateTextInputSchema>;

function formatTranslationResponse(response: KagiTranslationResponse): string {
  if (response.translation) {
    return response.translation;
  }

  if (response.translated_text) {
    return response.translated_text;
  }

  if (response.translations?.length) {
    return response.translations.join("\n");
  }

  if (response.items?.length) {
    return response.items.map((item) => item.translation).join("\n");
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

  return "Unknown translation error";
}

export function registerTranslateTextTool(server: McpServer, client: KagiClient): void {
  server.registerTool(
    "translate_text",
    {
      description: "Translate text between languages using Kagi Translate.",
      inputSchema: translateTextInputSchema,
    },
    async (input) => {
      try {
        const request = {
          source_lang: input.source_lang,
          target_lang: input.target_lang,
          ...(input.formality ? { formality: input.formality } : {}),
          ...(input.gender ? { gender: input.gender } : {}),
          ...(input.context ? { context: input.context } : {}),
          ...(input.text ? { text: input.text } : {}),
          ...(input.texts ? { texts: input.texts } : {}),
        };

        const response = await client.translateText(request);

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
