import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Static one-page site: index.html is the Vite entry, media lives in public/.
// Bundled CSS/JS land in dist/build/ so they never collide with public/assets/.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    assetsDir: 'build',
    target: 'es2022',
    cssCodeSplit: false,
    reportCompressedSize: true,
  },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
