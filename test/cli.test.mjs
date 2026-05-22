import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const distEntry = new URL("../dist/index.js", import.meta.url);

test("built CLI prints the package version", async () => {
  const result = await execFileAsync("node", [distEntry.pathname, "--version"]);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
});

test("built CLI prints health ok", async () => {
  const result = await execFileAsync("node", [distEntry.pathname, "--health"]);
  assert.equal(result.stdout.trim(), "ok");
});