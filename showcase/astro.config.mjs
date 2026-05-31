import { defineConfig, passthroughImageService } from 'astro/config';
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.vercel.app',
  image: { service: passthroughImageService() },
});
