import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

function exitWithCleanup(code, processes) {
  for (const process of processes) {
    if (!process.killed) {
      process.kill("SIGTERM");
    }
  }

  process.exit(code ?? 0);
}

async function main() {
  const build = spawnProcess("npm", ["run", "build"]);

  const buildExitCode = await new Promise((resolve) => {
    build.on("exit", (code) => resolve(code ?? 1));
  });

  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  const typecheckWatcher = spawnProcess("npm", ["run", "build", "--", "--watch"]);
  const serverWatcher = spawnProcess("node", ["--watch", "dist/index.js"]);

  const cleanup = () => exitWithCleanup(0, [typecheckWatcher, serverWatcher]);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  for (const child of [typecheckWatcher, serverWatcher]) {
    child.on("exit", (code) => {
      if (code && code !== 0) {
        exitWithCleanup(code, [typecheckWatcher, serverWatcher]);
      }
    });
  }
}

void main();