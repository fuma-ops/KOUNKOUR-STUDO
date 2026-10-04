import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Noms fixes pour le point d'entrée : le rendu serveur (api/seo.ts) peut
          // charger l'application même sans lire app.html. Les autres fichiers gardent un hash.
          entryFileNames: 'assets/app.js',
          assetFileNames: (info: { names?: string[]; name?: string }) =>
            (info.names?.[0] ?? info.name ?? '') === 'index.css' ? 'assets/app.css' : 'assets/[name]-[hash][extname]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
