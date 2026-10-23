import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sessionMiddleware } from './session';
import { errorHandler } from './http';
import { meRouter } from './routes/me';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { uploadsRouter } from './routes/uploads';
import { submissionsRouter } from './routes/submissions';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const SECRET = process.env.SESSION_SECRET || 'dev-secret';
if (process.env.NODE_ENV === 'production' && (SECRET === 'dev-secret' || SECRET === 'change-me')) {
  throw new Error('Set SESSION_SECRET to a long random value in production.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(SECRET));

const api = express.Router();
api.use(sessionMiddleware);
api.use(meRouter);
api.use(authRouter);
api.use(projectsRouter);
api.use(uploadsRouter);
api.use(submissionsRouter);
api.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use('/api', api);

if (process.env.NODE_ENV === 'production') {
  const dist = fileURLToPath(new URL('../../dist/client', import.meta.url));
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
