import vue from '@vitejs/plugin-vue';
import unocssInline from 'unocss-inline';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [unocss({ inspector: false }), vue(), unocssInline()],
  server: {
    host: '127.0.0.1',
  },
  esbuild: {
    legalComments: 'none',
  },
  build: {
    minify: false,
    cssMinify: false,
  },
});
