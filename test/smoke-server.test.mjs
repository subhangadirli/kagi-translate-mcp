import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { Client } from "../node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "../node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";

test("built server starts and lists tools over stdio", async () => {
  const serverPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
      KAGI_API_KEY: process.env.KAGI_API_KEY ?? "smoke-test-key",
    },
  });
  const client = new Client({ name: "smoke-test", version: "0.0.0" });

  try {
    await client.connect(transport);

    const result = await client.listTools();
    const names = result.tools.map((tool) => tool.name).sort();

    assert.deepEqual(names, ["proofread", "translate_text", "translate_url"]);
  } finally {
    await transport.close();
  }
});