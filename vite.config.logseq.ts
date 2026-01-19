import { defineConfig } from 'vite'
import { resolve } from 'path'

const isBuild = process.env.NODE_ENV === 'production'

export default defineConfig({
  root: isBuild ? 'src' : resolve(__dirname, 'src/logseq'),
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/logseq/index.html')
      },
      output: {
        entryFileNames: 'logseq.[name].js',
        chunkFileNames: 'logseq.[name].js',
        assetFileNames: 'logseq.[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime',
      // Use an absolute path for other aliases if needed
      // '@': path.resolve(__dirname, './src'),
    },
  },
})