import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import scrapeLiveHandler from './api/radar/scrape-live.ts';
import enrichHandler from './api/radar/enrich.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure image directory exists
const IMG_DIR = path.resolve(process.cwd(), 'public/images/administrations');
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

// API Radar Serverless Endpoints forwarded to identical Vercel functions
app.get('/api/radar/scrape-live', async (req, res) => {
  try {
    await scrapeLiveHandler(req, res);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur scraper' });
  }
});

app.get('/api/radar/enrich', async (req, res) => {
  try {
    await enrichHandler(req, res);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur enrichissement' });
  }
});

// Setup Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RADAR SERVER] Full-Stack server running on http://localhost:${PORT}`);
  });
}

startServer();
