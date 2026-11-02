/**
 * Builds the in-browser terminal bundle into public/playground/.
 *
 * Kept out of astro.config because ink-web's plugin aliases Node builtins
 * globally. `src/app.tsx` lives outside this package, so its bare imports would
 * otherwise resolve from the repo root (Ink 7) instead of here.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { inkWebPlugin } from 'ink-web/vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const dep = (name: string) => path.join(here, 'node_modules', name);

/**
 * Runs after inkWebPlugin so these aliases take priority:
 * - ink -> ink-web, whose bundle has its own Ink; a second copy wouldn't share context.
 * - chalk -> the real package, because ink-web's shim has no ansi256 (render/colors.ts).
 */
function bonsaiAliases(): Plugin {
  return {
    name: 'bonsai-aliases',
    config: () => ({
      resolve: {
        alias: [
          { find: /^ink$/, replacement: path.join(dep('ink-web'), 'dist/index.js') },
          { find: /^chalk$/, replacement: path.join(dep('chalk'), 'source/index.js') },
          { find: /^react($|\/.*)/, replacement: `${dep('react')}$1` },
        ],
      },
    }),
  };
}

export default defineConfig({
  plugins: [inkWebPlugin(), bonsaiAliases()],
  resolve: { dedupe: ['react', 'react-dom', 'react-reconciler', 'scheduler'] },
  publicDir: false,
  build: {
    outDir: 'public/playground',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/playground/main.tsx',
      output: {
        format: 'es',
        entryFileNames: 'playground.js',
        chunkFileNames: '[name].js',
        assetFileNames: 'playground[extname]',
      },
    },
  },
});
