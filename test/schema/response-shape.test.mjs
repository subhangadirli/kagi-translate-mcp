import test from 'node:test';
import assert from 'node:assert/strict';

const { KagiClient, KagiResponseError } = await import('../../dist/kagi/client.js');

test('translateText throws when response lacks translation fields (unit)', async () => {
  // Simulate server returning only unrelated fields by invoking parse logic via integration
  // Use a mock server in integration tests; here we assert the client throws on bad shapes.
  const { createMockKagiServer } = await import('../helpers/http-mock-server.mjs');
  const server = createMockKagiServer({
    '/api/translate': () => ({ status: 200, body: { unrelated: true } }),
  });

  const port = await server.listen();
  const client = new KagiClient('fake', `http://127.0.0.1:${port}`);

  try {
    await assert.rejects(async () => {
      await client.translateText({ text: 'hi', source_lang: 'en', target_lang: 'ja' });
    }, (err) => err instanceof KagiResponseError);
  } finally {
    await server.close();
  }
});

test('proofread throws when response lacks corrected text (unit)', async () => {
  const { createMockKagiServer } = await import('../helpers/http-mock-server.mjs');
  const server = createMockKagiServer({
    '/api/proofread': () => ({ status: 200, body: { foo: 'bar' } }),
  });

  const port = await server.listen();
  const client = new KagiClient('fake', `http://127.0.0.1:${port}`);

  try {
    await assert.rejects(async () => {
      await client.proofread({ text: 'Ths is bad' });
    }, (err) => err instanceof KagiResponseError);
  } finally {
    await server.close();
  }
});
