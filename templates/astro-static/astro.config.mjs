import { defineConfig } from 'astro/config';

// SITE_BASE задаётся build:all, чтобы собрать сайт под /s/<slug>/ в общей витрине.
// Локально (npm run dev) база = '/', сайт открывается в корне.
export default defineConfig({
  base: process.env.SITE_BASE || '/',
});
