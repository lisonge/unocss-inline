import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/style.ts'],
  format: 'esm',
  fixedExtension: false,
  dts: true,
  clean: true,
});
