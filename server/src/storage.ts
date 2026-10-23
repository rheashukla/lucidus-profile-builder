import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface Storage {
  /** Stores the file at `filePath` under `key`. */
  putFile(key: string, filePath: string, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  removeMany(keys: string[]): Promise<void>;
}

export class LocalStorage implements Storage {
  constructor(private root: string) {}
  private resolve(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(path.resolve(this.root) + path.sep)) throw new Error('Bad storage key');
    return p;
  }
  async putFile(key: string, filePath: string) {
    const dest = this.resolve(key);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.copyFile(filePath, dest);
  }
  async get(key: string) { return fsp.readFile(this.resolve(key)); }
  async removeMany(keys: string[]) {
    await Promise.all(keys.map((k) => fsp.rm(this.resolve(k), { force: true })));
  }
}

export class S3Storage implements Storage {
  private s3: S3Client;
  constructor(private bucket: string) {
    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: process.env.S3_ACCESS_KEY_ID
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' }
        : undefined,
    });
  }
  async putFile(key: string, filePath: string, contentType: string) {
    const { size } = await fsp.stat(filePath);
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: fs.createReadStream(filePath), ContentLength: size, ContentType: contentType,
    }));
  }
  async get(key: string) {
    const out = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await out.Body!.transformToByteArray());
  }
  async removeMany(keys: string[]) {
    for (let i = 0; i < keys.length; i += 1000) {
      const chunk = keys.slice(i, i + 1000);
      if (chunk.length) await this.s3.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: chunk.map((Key) => ({ Key })) } }));
    }
  }
}

function make(): Storage {
  if (process.env.STORAGE_DRIVER === 's3') {
    if (!process.env.S3_BUCKET) throw new Error('STORAGE_DRIVER=s3 needs S3_BUCKET');
    return new S3Storage(process.env.S3_BUCKET);
  }
  return new LocalStorage(path.resolve(process.cwd(), 'uploads'));
}

export const storage: Storage = make();
