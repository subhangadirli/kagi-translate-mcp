import assert from "node:assert/strict";
import test from "node:test";
import { KagiApiError } from "../dist/kagi/client.js";
import { registerProofreadTool } from "../dist/tools/proofread.js";
import { registerTranslateTextTool } from "../dist/tools/translate.js";
import { registerTranslateUrlTool } from "../dist/tools/translateUrl.js";
import { createMockKagiClient, createMockServer } from "./helpers/mock-kagi-client.mjs";

test("translate_text registration maps input and formats API errors", async () => {
  const server = createMockServer();
  let seenRequest = null;

  registerTranslateTextTool(server, createMockKagiClient({
    async translateText(request) {
      seenRequest = request;
      return { translation: "hola" };
    },
  }));

  assert.equal(server.tools[0].name, "translate_text");
  assert.equal(server.tools[0].options.description, "Translate text between languages using Kagi Translate.");

  const success = await server.tools[0].handler({
    source_lang: "en",
    target_lang: "es",
    text: "Hello",
    formality: "formal",
    gender: "neutral",
    context: "greeting",
  });

  assert.deepEqual(seenRequest, {
    source_lang: "en",
    target_lang: "es",
    formality: "formal",
    gender: "neutral",
    context: "greeting",
    text: "Hello",
  });
  assert.deepEqual(success, {
    content: [{ type: "text", text: "hola" }],
  });

  registerTranslateTextTool(server, createMockKagiClient({
    async translateText() {
      throw new KagiApiError("bad request", 400, { error: "bad request" });
    },
  }));

  const failure = await server.tools[1].handler({
    source_lang: "en",
    target_lang: "es",
    text: "Hello",
  });

  assert.equal(failure.isError, true);
  assert.equal(failure.content[0].text, "Kagi API error (400): bad request");
});

test("translate_url registration maps input and formats API errors", async () => {
  const server = createMockServer();
  let seenRequest = null;

  registerTranslateUrlTool(server, createMockKagiClient({
    async translateUrl(request) {
      seenRequest = request;
      return { translated_url: "https://translated.example" };
    },
  }));

  assert.equal(server.tools[0].name, "translate_url");
  assert.equal(server.tools[0].options.description, "Translate the content of a URL using Kagi Translate.");

  const success = await server.tools[0].handler({
    url: "https://example.com/article",
    source_lang: "en",
    target_lang: "ja",
    formality: "informal",
    gender: "female",
  });

  assert.deepEqual(seenRequest, {
    url: "https://example.com/article",
    source_lang: "en",
    target_lang: "ja",
    formality: "informal",
    gender: "female",
  });
  assert.deepEqual(success, {
    content: [{ type: "text", text: "https://translated.example" }],
  });

  registerTranslateUrlTool(server, createMockKagiClient({
    async translateUrl() {
      throw new KagiApiError("service unavailable", 503, { message: "service unavailable" });
    },
  }));

  const failure = await server.tools[1].handler({
    url: "https://example.com/article",
    source_lang: "en",
    target_lang: "ja",
  });

  assert.equal(failure.isError, true);
  assert.equal(failure.content[0].text, "Kagi API error (503): service unavailable");
});

test("proofread registration maps input and formats API errors", async () => {
  const server = createMockServer();
  let seenRequest = null;

  registerProofreadTool(server, createMockKagiClient({
    async proofread(request) {
      seenRequest = request;
      return { corrected_text: "This is a sentence." };
    },
  }));

  assert.equal(server.tools[0].name, "proofread");
  assert.equal(server.tools[0].options.description, "Proofread text with Kagi Translate.");

  const success = await server.tools[0].handler({
    text: "This is a sentense.",
    language: "en",
    target_lang: "en",
  });

  assert.deepEqual(seenRequest, {
    text: "This is a sentense.",
    language: "en",
    target_lang: "en",
  });
  assert.deepEqual(success, {
    content: [{ type: "text", text: "This is a sentence." }],
  });

  registerProofreadTool(server, createMockKagiClient({
    async proofread() {
      throw new KagiApiError("quota exceeded", 429, { detail: "quota exceeded" });
    },
  }));

  const failure = await server.tools[1].handler({
    text: "This is a sentense.",
  });

  assert.equal(failure.isError, true);
  assert.equal(failure.content[0].text, "Kagi API error (429): quota exceeded");
});