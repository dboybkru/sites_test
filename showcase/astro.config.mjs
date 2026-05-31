import { defineConfig } from 'astro/config';

// Витрина всегда деплоится в корень домена на Vercel.
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.vercel.app',
});
