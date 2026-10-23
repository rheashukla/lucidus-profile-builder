import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sessionMiddleware } from './session';
import { errorHandler } from './http';
import { meRouter } from './routes/me';
import { projectsRouter } from './routes/projects';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret'));

const api = express.Router();
api.use(sessionMiddleware);
api.use(meRouter);
api.use(projectsRouter);
api.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use('/api', api);

if (process.env.NODE_ENV === 'production') {
  const dist = fileURLToPath(new URL('../../dist/client', import.meta.url));
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
