import http from 'node:http';

export function createMockKagiServer(routes = {}) {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (d) => chunks.push(d));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const handler = routes[req.url] || routes['*'];
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }

      Promise.resolve()
        .then(() => handler(req, body))
        .then(({ status = 200, body: responseBody }) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseBody));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        });
    });
  });

  return {
    listen(port = 0) {
      return new Promise((resolve, reject) => {
        server.listen(port, () => resolve(server.address().port));
        server.on('error', reject);
      });
    },
    close() {
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
