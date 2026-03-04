/**
 * vitest.config.ts — project root
 *
 * KEY FIX: environmentMatchGlobs
 * ─────────────────────────────────────────────────────────────────────────────
 * The default environment is 'jsdom'. API route tests import from 'next/server'
 * (NextRequest, NextResponse) and use tweetnacl. Both fail in jsdom because:
 *
 *   1. next/server relies on Node.js internals unavailable in jsdom.
 *      The module exports (OPTIONS, POST) resolve to undefined → "not a function".
 *
 *   2. tweetnacl's checkArrayTypes() uses `instanceof Uint8Array`. In jsdom,
 *      Uint8Array comes from the jsdom realm, not the Node.js realm. Even
 *      explicitly casting with `new Uint8Array()` produces a jsdom-realm object
 *      that fails the instanceof check → "unexpected type, use Uint8Array".
 *
 * Solution: `environmentMatchGlobs` forces all files under __tests__/api/
 * to use the Node.js environment. This is more reliable than the per-file
 * `// @vitest-environment node` comment, which can be ignored when pool:'forks'
 * is in use or when the comment is not on the absolute first byte of the file.
 */

import { defineConfig } from 'vitest/config';
import react            from '@vitejs/plugin-react';
import path             from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // ── Default test environment ───────────────────────────────────────────────
    environment: 'jsdom',
    globals:     true,

    // ── Per-glob environment overrides ────────────────────────────────────────
    // Files matching these globs run in 'node' even though the default is 'jsdom'.
    // This is the authoritative override — more reliable than file-level comments.
    environmentMatchGlobs: [
      ['__tests__/api/**', 'node'],
    ],

    // ── Setup files (run before every test file) ──────────────────────────────
    setupFiles: ['./vitest.setup.ts'],

    // ── Test file patterns ────────────────────────────────────────────────────
    include: [
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      '.next/**',
      'dist/**',
    ],

    // ── Reporters ─────────────────────────────────────────────────────────────
    reporters: ['verbose'],

    // ── Coverage (run with: npm run test:coverage) ────────────────────────────
    coverage: {
      provider: 'v8',

      include: [
        'lib/utils.ts',
        'lib/auth-service.ts',
        'lib/services/learning-progress.ts',
        'lib/services/SupabaseProgressService.ts',
        'middleware.ts',
        'contexts/AuthContext.tsx',
        'app/api/auth/link-wallet/route.ts',
      ],

      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/__tests__/**',
        '**/vitest.setup.ts',
      ],

      reporter:         ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: './coverage',

      thresholds: {
        statements: 80,
        branches:   75,
        functions:  80,
        lines:      80,
        perFile:    false,
      },

      all:   true,
      clean: true,
    },

    // ── Timeout ───────────────────────────────────────────────────────────────
    testTimeout: 10_000,

    // ── Pool ─────────────────────────────────────────────────────────────────
    pool: 'forks',
  },

  // ── Module resolution (mirrors tsconfig paths) ────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
