import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockKagiServer } from '../helpers/http-mock-server.mjs';
import { fileURLToPath } from 'url';

const { KagiClient, KagiResponseError } = await import('../../dist/kagi/client.js');

test('KagiClient handles valid translation from mock server', async () => {
  const fixture = { translation: 'bonjour' };

  const server = createMockKagiServer({
    '/api/translate': () => ({ status: 200, body: fixture }),
  });

  const port = await server.listen();
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new KagiClient('fake', baseUrl);

  try {
    const res = await client.translateText({ text: 'hello', source_lang: 'en', target_lang: 'fr' });
    assert.equal(res.translation, 'bonjour');
  } finally {
    await server.close();
  }
});

test('KagiClient rejects responses missing translation fields', async () => {
  const fixture = { foo: 'bar' };

  const server = createMockKagiServer({
    '/api/translate': () => ({ status: 200, body: fixture }),
  });

  const port = await server.listen();
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new KagiClient('fake', baseUrl);

  try {
    await assert.rejects(async () => {
      await client.translateText({ text: 'hello', source_lang: 'en', target_lang: 'fr' });
    }, (err) => err instanceof KagiResponseError);
  } finally {
    await server.close();
  }
});
