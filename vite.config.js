import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';

// https://vitejs.dev/guide/build.html#multi-page-app
// https://vitejs.dev/guide/static-deploy.html#github-pages
export default defineConfig({
  plugins: [glsl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        gem: resolve(__dirname, 'gem/index.html')
      }
    }
  }
});
