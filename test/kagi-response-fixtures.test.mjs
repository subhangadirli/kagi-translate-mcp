import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { registerProofreadTool } from "../dist/tools/proofread.js";
import { registerTranslateTextTool } from "../dist/tools/translate.js";
import { registerTranslateUrlTool } from "../dist/tools/translateUrl.js";
import { createMockKagiClient, createMockServer } from "./helpers/mock-kagi-client.mjs";

async function loadFixture(relativePath) {
  const fixtureUrl = new URL(`./fixtures/${relativePath}`, import.meta.url);
  const content = await readFile(fileURLToPath(fixtureUrl), "utf8");
  return JSON.parse(content);
}

test("translate_text uses representative item fixtures", async () => {
  const server = createMockServer();
  const fixture = await loadFixture("translate-text-items.json");

  registerTranslateTextTool(server, createMockKagiClient({
    async translateText() {
      return fixture;
    },
  }));

  const result = await server.tools[0].handler({
    source_lang: "en",
    target_lang: "es",
    texts: ["Hello", "World"],
  });

  assert.equal(result.content[0].text, "Hola\nMundo");
});

test("translate_url uses representative translated_url fixture", async () => {
  const server = createMockServer();
  const fixture = await loadFixture("translate-url-response.json");

  registerTranslateUrlTool(server, createMockKagiClient({
    async translateUrl() {
      return fixture;
    },
  }));

  const result = await server.tools[0].handler({
    url: "https://example.com/article",
    source_lang: "en",
    target_lang: "ja",
  });

  assert.equal(result.content[0].text, "https://translated.example/article");
});

test("proofread uses representative proofread fixture", async () => {
  const server = createMockServer();
  const fixture = await loadFixture("proofread-response.json");

  registerProofreadTool(server, createMockKagiClient({
    async proofread() {
      return fixture;
    },
  }));

  const result = await server.tools[0].handler({
    text: "This is a sentense.",
  });

  assert.equal(result.content[0].text, "This is a sentence.");
});