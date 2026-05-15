import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { KagiClient } from "../kagi/client.js";
import { registerProofreadTool } from "./proofread.js";
import { registerTranslateTextTool } from "./translate.js";
import { registerTranslateUrlTool } from "./translateUrl.js";

export function registerTools(server: McpServer, client: KagiClient): void {
  registerTranslateTextTool(server, client);
  registerTranslateUrlTool(server, client);
  registerProofreadTool(server, client);
}
