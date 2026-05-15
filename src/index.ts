import "dotenv/config";
import { runServer } from "./server.js";

function readApiKey(): string {
  const apiKey = process.env.KAGI_API_KEY;

  if (!apiKey) {
    throw new Error("KAGI_API_KEY is required");
  }

  return apiKey;
}

async function main(): Promise<void> {
  try {
    await runServer({ apiKey: readApiKey() });
  } catch (error) {
    console.error("Failed to start Kagi Translate MCP server:", error);
    process.exitCode = 1;
  }
}

void main();
