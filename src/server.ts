import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KagiClient } from "./kagi/client.js";
import { registerTools } from "./tools/index.js";

export interface ServerConfig {
  apiKey: string;
}

export function createServer(config: ServerConfig): McpServer {
  const server = new McpServer({
    name: "kagi-translate-mcp",
    version: "0.1.0",
  });

  const client = new KagiClient(config.apiKey);
  registerTools(server, client);

  return server;
}

export async function runServer(config: ServerConfig): Promise<void> {
  const server = createServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);
}
