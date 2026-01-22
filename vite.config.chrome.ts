import { defineConfig } from 'vite'
import { resolve } from 'path'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/', // Use relative paths for assets
  root: 'src',
  plugins: [preact()],
  build: {
    outDir: '../dist', // Build output to root dist directory
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/chrome/popup.html'), // Input from chrome directory
        background: resolve(__dirname, 'src/chrome/background.ts') // Background service worker
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Background script should not have hash in name
          return chunkInfo.name === 'background' ? '[name].js' : 'chrome.[name].js'
        },
        chunkFileNames: 'chrome.[name].js',
        assetFileNames: 'chrome.[name][extname]'
      }
    }
  }
})