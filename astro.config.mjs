// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify'; // <-- Importa el adaptador de Netlify

export default defineConfig({
  // ... otras configuraciones que ya tengas
  output: 'server',
  adapter: netlify(),
  site: 'https://yalisalvaje.cl',
});