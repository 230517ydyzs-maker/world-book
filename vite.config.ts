import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';
import { defineConfig } from 'vite';

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'story-generator-ai-proxy',
      configureServer(server) {
        server.middlewares.use('/api/ai-proxy', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const body = JSON.parse(await readBody(req)) as {
              baseUrl: string;
              apiKey: string;
              model: string;
              temperature: number;
              messages: Array<{ role: string; content: string }>;
            };
            const upstream = await fetch(`${body.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${body.apiKey}`
              },
              body: JSON.stringify({
                model: body.model,
                temperature: body.temperature,
                messages: body.messages
              })
            });

            res.statusCode = upstream.status;
            res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
            res.end(await upstream.text());
          } catch (error) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: error instanceof Error ? error.message : 'AI proxy request failed'
            }));
          }
        });
      }
    }
  ]
});
