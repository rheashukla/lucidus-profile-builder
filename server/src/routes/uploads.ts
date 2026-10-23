import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { FileRef } from '@shared/types';
import { handle, HttpError } from '../http';
import { storage } from '../storage';

export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED = /^(image|video|audio)\/[\w.+-]+$|^application\/pdf$/;

const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { files: MAX_FILES, fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.test(file.mimetype)),
});

export const uploadsRouter = Router();

uploadsRouter.post('/uploads', (req, res, next) => {
  upload.array('files', MAX_FILES)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 20 MB or smaller.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload up to ${MAX_FILES} files at a time.`
          : 'Upload failed.';
      return next(new HttpError(400, msg));
    }
    next(err);
  });
}, handle(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  if (!files.length) throw new HttpError(400, 'Add an image, video, audio file or PDF.');
  try {
    const out: FileRef[] = [];
    for (const f of files) {
      const name = Buffer.from(f.originalname, 'latin1').toString('utf8').slice(0, 200);
      const ext = path.extname(name).toLowerCase().replace(/[^.\w]/g, '').slice(0, 10);
      const key = `${req.userId}/${crypto.randomUUID()}${ext}`;
      await storage.putFile(key, f.path, f.mimetype);
      out.push({ key, name, type: f.mimetype, size: f.size });
    }
    res.json(out);
  } finally {
    await Promise.all(files.map((f) => fsp.rm(f.path, { force: true })));
  }
}));
