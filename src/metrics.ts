import http from 'node:http';
import client from 'prom-client';

const register = client.register;

export const requestCounter = new client.Counter({
  name: 'kagi_translate_requests_total',
  help: 'Total outbound requests to Kagi',
});

export function startMetricsServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      const body = await register.metrics();
      res.end(body);
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  server.listen(port);
  return server;
}

export default { register, requestCounter, startMetricsServer };
