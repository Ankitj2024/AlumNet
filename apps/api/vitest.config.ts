import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/services/**', 'src/utils/**', 'src/jobs/**'],
      exclude: ['src/**/*.d.ts', 'src/server.ts'],
    },
  },
});

