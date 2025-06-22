// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  // ... otras configuraciones que ya tengas
  output: 'server',
  adapter: node({
    mode: 'standalone', // <-- ¡Añade esta línea!
  }),
});