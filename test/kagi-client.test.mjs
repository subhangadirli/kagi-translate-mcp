import assert from "node:assert/strict";
import test from "node:test";
import { KagiApiError, KagiClient } from "../dist/kagi/client.js";

test("translateText does not retry non-retryable 4xx errors", async () => {
  const client = new KagiClient("test-api-key", "https://example.test");
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  globalThis.fetch = async () => {
    fetchCalls += 1;

    return new Response(JSON.stringify({ error: "invalid request", detail: "bad payload" }), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  try {
    await assert.rejects(
      client.translateText({
        source_lang: "en",
        target_lang: "ja",
        text: "Hello",
      }),
      (error) => {
        assert.ok(error instanceof KagiApiError);
        assert.equal(error.status, 400);
        assert.deepEqual(error.body, {
          error: "invalid request",
          detail: "bad payload",
        });
        assert.equal(error.message, "invalid request");
        return true;
      }
    );

    assert.equal(fetchCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("translateText fails clearly on an unexpected response shape", async () => {
  const client = new KagiClient("test-api-key", "https://example.test");
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      items: [
        {
          source: "Hello",
        },
      ],
      source_lang: "en",
      target_lang: "es",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  try {
    await assert.rejects(
      client.translateText({
        source_lang: "en",
        target_lang: "es",
        text: "Hello",
      }),
      (error) => {
        assert.equal(error.name, "KagiResponseError");
        assert.equal(error.message, "Kagi returned an unexpected response shape from /api/translate");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});