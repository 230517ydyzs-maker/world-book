import http from 'node:http';

const PORT = 8787;

function readBody(req) {
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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/ai-proxy') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    const upstream = await fetch(`${String(body.baseUrl).replace(/\/+$/, '')}/chat/completions`, {
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
    const text = await upstream.text();

    res.writeHead(upstream.status, {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
    });
    res.end(text);
  } catch (error) {
    sendJson(res, 502, {
      error: error instanceof Error ? error.message : 'AI proxy request failed'
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AI proxy listening at http://127.0.0.1:${PORT}`);
});
