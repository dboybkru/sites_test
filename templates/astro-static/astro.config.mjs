import { defineConfig, passthroughImageService } from 'astro/config';
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  image: { service: passthroughImageService() },
});
