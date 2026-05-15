import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KagiApiError, KagiNetworkError, KagiResponseError } from "../kagi/client.js";
import type { KagiClient } from "../kagi/client.js";
import type { KagiProofreadResponse } from "../kagi/types.js";

export const proofreadInputSchema = z.object({
  text: z.string().min(1),
  language: z.string().min(1).optional(),
  target_lang: z.string().min(1).optional(),
});

export type ProofreadInput = z.infer<typeof proofreadInputSchema>;

function formatProofreadResponse(response: KagiProofreadResponse): string {
  if (response.corrected_text) {
    return response.corrected_text;
  }

  if (response.proofread) {
    return response.proofread;
  }

  if (response.text) {
    return response.text;
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

  return "Unknown proofreading error";
}

export function registerProofreadTool(server: McpServer, client: KagiClient): void {
  server.registerTool(
    "proofread",
    {
      description: "Proofread text with Kagi Translate.",
      inputSchema: proofreadInputSchema,
    },
    async (input) => {
      try {
        const request = {
          text: input.text,
          ...(input.language ? { language: input.language } : {}),
          ...(input.target_lang ? { target_lang: input.target_lang } : {}),
        };

        const response = await client.proofread(request);

        return {
          content: [
            {
              type: "text",
              text: formatProofreadResponse(response),
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
