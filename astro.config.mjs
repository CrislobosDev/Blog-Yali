// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify'; // <-- Importa el adaptador de Netlify

export default defineConfig({
  // ... otras configuraciones que ya tengas
  output: 'server', // <-- Mantenemos 'server' porque necesitas las API routes
  adapter: netlify(), // <-- Usa el adaptador de Netlify
});