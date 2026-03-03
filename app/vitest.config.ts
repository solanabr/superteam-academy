import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['test/unit/**/*.test.ts'],
        exclude: ['node_modules', '.next', 'test/e2e'],
        setupFiles: ['./test/unit/setup.ts'],
        coverage: {
            provider: 'v8',
            reportsDirectory: './test/reports/coverage',
            reporter: ['text', 'json-summary', 'html'],
            include: [
                'backend/**/*.ts',
                'context/**/*.ts',
                'lib/**/*.ts',
                'app/api/**/*.ts',
            ],
            exclude: [
                'node_modules',
                '.next',
                'test/**',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/*.d.ts',
            ],
        },
        testTimeout: 15000,
    },
});
