import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runServer } from "./server.js";
import { error as logError } from "./logging.js";
import { startMetricsServer } from "./metrics.js";

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

    const metricsPort = process.env.METRICS_PORT ? Number(process.env.METRICS_PORT) : undefined;
    let metricsServer;
    if (metricsPort) {
      metricsServer = startMetricsServer(metricsPort);
      console.error(JSON.stringify({ msg: 'metrics_listening', port: metricsPort }));
    }

    await runServer({ apiKey: readApiKey() });

    if (metricsServer && typeof metricsServer.close === 'function') {
      // no-op: keep metrics server running for process lifetime
    }
  } catch (err) {
    logError("Failed to start Kagi Translate MCP server", { error: String(err) });
    process.exitCode = 1;
  }
}

void main();
