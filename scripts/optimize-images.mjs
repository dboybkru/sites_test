#!/usr/bin/env node
// Ресайз + конвертация тяжёлых исходников из assets-incoming в web-webp по сайтам.
// Запуск: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = (p) => join(root, 'assets-incoming', p);
const S = (slug, name) => join(root, 'sites', slug, 'public', 'img', name);

const jobs = [
  // wave 2 (Canva-generated)
  { src: A('gen-01-runner.png'), dest: S('01-hello-motion', 'runner.webp'), width: 1920, q: 80 },
  { src: A('gen-02-fintech.png'), dest: S('02-bento-box', 'chart.webp'), width: 1500, q: 80 },
  { src: A('gen-05-fashion.png'), dest: S('05-hypertypography', 'model.webp'), width: 1500, q: 82 },
  { src: A('gen-07-headphones.png'), dest: S('07-spatial-3d', 'headphones.webp'), width: 1400, q: 82 },
];

for (const j of jobs) {
  if (!existsSync(j.src)) { console.log(`SKIP (no src): ${j.src}`); continue; }
  mkdirSync(dirname(j.dest), { recursive: true });
  await sharp(j.src).rotate().resize({ width: j.width, withoutEnlargement: true }).webp({ quality: j.q }).toFile(j.dest);
  const kb = Math.round(statSync(j.dest).size / 1024);
  console.log(`✓ ${j.dest.replace(root, '.')} — ${kb} KB`);
}
console.log('Готово.');
