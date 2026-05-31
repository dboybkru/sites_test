#!/usr/bin/env node
// Создаёт новый сайт в sites/<slug> из templates/astro-static.
// Использование: npm run new -- <slug> ["Название"]
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
const title = process.argv[3] || slug;

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Укажи slug в kebab-case: npm run new -- 02-my-site "Моё название"');
  process.exit(1);
}

const src = join(root, 'templates', 'astro-static');
const dest = join(root, 'sites', slug);
if (existsSync(dest)) {
  console.error(`sites/${slug} уже существует.`);
  process.exit(1);
}

mkdirSync(join(root, 'sites'), { recursive: true });
cpSync(src, dest, { recursive: true });

// package.json: уникальное имя workspace
const pkgPath = join(dest, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = `@site/${slug}`;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// site.meta.json: подставить название/slug
const metaPath = join(dest, 'site.meta.json');
if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  meta.title = title;
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
}

console.log(`✅ Создан sites/${slug}`);
console.log('Дальше:');
console.log('  npm install');
console.log(`  npm run dev --workspace @site/${slug}`);
