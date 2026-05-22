import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runServer } from "./server.js";
import { error as logError } from "./logging.js";

async function readPackageVersion(): Promise<string> {
  const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { version?: string };

  if (!packageJson.version) {
    throw new Error("Package version is unavailable");
  }

  return packageJson.version;
}

function readApiKey(): string {
  const apiKey = process.env.KAGI_API_KEY;

  if (!apiKey) {
    throw new Error("KAGI_API_KEY is required");
  }

  return apiKey;
}

async function main(): Promise<void> {
  try {
    if (process.argv.includes("--version") || process.argv.includes("-v")) {
      console.log(await readPackageVersion());
      return;
    }

    if (process.argv.includes("--health")) {
      console.log("ok");
      return;
    }

    await runServer({ apiKey: readApiKey() });
  } catch (err) {
    logError("Failed to start Kagi Translate MCP server", { error: String(err) });
    process.exitCode = 1;
  }
}

void main();
