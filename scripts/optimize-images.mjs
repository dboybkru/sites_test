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
  // wave 1 (Canva-generated)
  { src: A('gen-03-sky.png'), dest: S('03-glassmorphism', 'sky.webp'), width: 1920, q: 80 },
  { src: A('gen-10-nebula.png'), dest: S('10-ai-gradients', 'nebula.webp'), width: 1920, q: 80 },
  { src: A('gen-09-clay.png'), dest: S('09-claymorphism', 'clay.webp'), width: 1600, q: 82 },
];

for (const j of jobs) {
  if (!existsSync(j.src)) { console.log(`SKIP (no src): ${j.src}`); continue; }
  mkdirSync(dirname(j.dest), { recursive: true });
  await sharp(j.src).rotate().resize({ width: j.width, withoutEnlargement: true }).webp({ quality: j.q }).toFile(j.dest);
  const kb = Math.round(statSync(j.dest).size / 1024);
  console.log(`✓ ${j.dest.replace(root, '.')} — ${kb} KB`);
}
console.log('Готово.');
