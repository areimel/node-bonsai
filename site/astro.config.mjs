import { defineConfig } from 'astro/config';

// No ink-web plugin here: it aliases Node builtins globally. The terminal is a
// separate bundle (vite.playground.config.ts -> public/playground/).
export default defineConfig({
  site: 'https://areimel.github.io',
  base: '/node-bonsai',
  trailingSlash: 'always',
  output: 'static',
});
