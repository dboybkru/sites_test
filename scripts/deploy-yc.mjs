#!/usr/bin/env node
// Деплой showcase/dist в Yandex Object Storage (S3-совместимый статик-хостинг).
// Запуск: npm run deploy:yc   (читает .env: YC_BUCKET, YC_ACCESS_KEY_ID, YC_SECRET_ACCESS_KEY)
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'showcase', 'dist');

const BUCKET = process.env.YC_BUCKET;
const ACCESS = process.env.YC_ACCESS_KEY_ID;
const SECRET = process.env.YC_SECRET_ACCESS_KEY;

if (!BUCKET || !ACCESS || !SECRET) {
  console.error(
    'Нужны YC_BUCKET, YC_ACCESS_KEY_ID, YC_SECRET_ACCESS_KEY (см. .env.example и docs/DEPLOY-YANDEX.md).'
  );
  process.exit(1);
}
if (!existsSync(distDir)) {
  console.error('Нет showcase/dist — сначала `npm run build:all`.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
  forcePathStyle: true,
});

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(distDir);
const localKeys = new Set();

console.log(`Загружаю ${files.length} файлов в s3://${BUCKET} …`);
for (const file of files) {
  const key = relative(distDir, file).split(sep).join('/');
  localKeys.add(key);
  const ext = extname(file).toLowerCase();
  const isHashed = /\.[A-Za-z0-9_-]{8,}\.(css|js|mjs|woff2?|png|jpe?g|webp|avif|svg)$/.test(key);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: readFileSync(file),
      ContentType: MIME[ext] || 'application/octet-stream',
      ACL: 'public-read',
      CacheControl: isHashed
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    })
  );
  process.stdout.write('.');
}
console.log('\nЗагрузка завершена.');

// sync --delete: убрать с бакета объекты, которых больше нет локально
let token;
const stale = [];
do {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
  );
  for (const o of res.Contents || []) if (!localKeys.has(o.Key)) stale.push({ Key: o.Key });
  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

if (stale.length) {
  for (let i = 0; i < stale.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: stale.slice(i, i + 1000), Quiet: true },
      })
    );
  }
  console.log(`Удалено устаревших объектов: ${stale.length}`);
}

console.log(`\n✅ Деплой готов → https://${BUCKET}.website.yandexcloud.net`);
