import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import { handleClientApi } from './src/utils/clientApi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// SSE subscribers for live audit/activity monitoring
const sseClients: Response[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // client dropped
    }
  });
}

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Unified Enterprise API Router backed by shared NMDCDataStore & validation rules
app.all('/api/*', async (req: Request, res: Response) => {
  try {
    const result: any = await handleClientApi(req.originalUrl, {
      method: req.method,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body || {}) : undefined,
    });
    if (db.activityLogs[0] && req.method !== 'GET') {
      broadcastSSE('activity', db.activityLogs[0]);
    }
    res.json(result);
  } catch (err: any) {
    const msg = err?.message || 'Internal server error';
    const status = msg.includes('not found')
      ? 404
      : msg.includes('Invalid Email') || msg.includes('pending') || msg.includes('suspended')
      ? 401
      : 400;
    res.status(status).json({ success: false, message: msg });
  }
});

// Vite Middleware Mounting (Dev) & Static Serving (Prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NMDC Enterprise Portal Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
