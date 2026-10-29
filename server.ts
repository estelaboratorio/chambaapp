import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run automatically injects the PORT environment variable (default 8080 or 3000)
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Serve static assets from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check endpoint for Cloud Run container probes
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// SPA routing fallback: send index.html for all client-side routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ChambaApp production server running on http://0.0.0.0:${port}`);
});
