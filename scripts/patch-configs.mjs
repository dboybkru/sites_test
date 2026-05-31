#!/usr/bin/env node
// Переводит Astro на passthrough image-service во всех конфигах, чтобы build не грузил sharp
// (на Windows его нативный модуль даёт флапающий крэш 0xC0000409). Картинки у нас — из public/,
// оптимизация Astro не нужна. sharp остаётся для scripts/optimize-images.mjs.
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteCfg = `import { defineConfig, passthroughImageService } from 'astro/config';
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  image: { service: passthroughImageService() },
});
`;
const showcaseCfg = `import { defineConfig, passthroughImageService } from 'astro/config';
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.vercel.app',
  image: { service: passthroughImageService() },
});
`;

let n = 0;
const sitesDir = join(root, 'sites');
for (const slug of readdirSync(sitesDir)) {
  const cfg = join(sitesDir, slug, 'astro.config.mjs');
  if (existsSync(cfg)) { writeFileSync(cfg, siteCfg); n++; }
}
writeFileSync(join(root, 'templates', 'astro-static', 'astro.config.mjs'), siteCfg); n++;
writeFileSync(join(root, 'showcase', 'astro.config.mjs'), showcaseCfg); n++;
console.log(`patched ${n} astro configs`);
