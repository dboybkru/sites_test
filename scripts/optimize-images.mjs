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
  { src: A('Gemini_Generated_Image_qgwdcqgwdcqgwdcq.png'), dest: S('06-natural-aesthetic', 'hero.webp'), width: 1920, q: 80 },
  { src: A('Gemini_Generated_Image_57n57857n57857n5.png'), dest: S('11-dark-minimal', 'hero.webp'), width: 2000, q: 80 },
  { src: A('Gemini_Generated_Image_jsideojsideojsid.png'), dest: S('04-retro-futurism', 'neon.webp'), width: 1500, q: 76 },
  { src: A('Gemini_Generated_Image_d4ozpd4ozpd4ozpd.png'), dest: S('15-architecture', 'day.webp'), width: 1920, q: 80 },
  { src: A('Gemini_Generated_Image_xyy3wlxyy3wlxyy3.png'), dest: S('15-architecture', 'night.webp'), width: 1920, q: 80 },
];

for (const j of jobs) {
  if (!existsSync(j.src)) { console.log(`SKIP (no src): ${j.src}`); continue; }
  mkdirSync(dirname(j.dest), { recursive: true });
  await sharp(j.src).rotate().resize({ width: j.width, withoutEnlargement: true }).webp({ quality: j.q }).toFile(j.dest);
  const kb = Math.round(statSync(j.dest).size / 1024);
  console.log(`✓ ${j.dest.replace(root, '.')} — ${kb} KB`);
}
console.log('Готово.');
