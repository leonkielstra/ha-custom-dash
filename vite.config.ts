import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'ha-custom-dash.js',
    },
    target: 'es2022',
    sourcemap: true,
  },
});
