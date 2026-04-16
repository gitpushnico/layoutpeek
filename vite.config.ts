import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    // No PostCSS plugins; tokens live in injected bookmarklet CSS.
    postcss: {
      plugins: [],
    },
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'LayoutPeek',
      formats: ['iife'],
      fileName: () => 'layoutpeek',
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
      mangle: {
        toplevel: false,
      },
      format: {
        comments: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
