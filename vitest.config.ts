import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/clipper-core/**/*.ts'],
      exclude: ['src/lib/clipper-core/**/*.test.ts', 'src/lib/clipper-core/types/**'],
    },
  },
});

