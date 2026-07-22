import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text'],
            include: ['dist/**/*.js'],
            exclude: [
                'dist/**/*.d.ts',
            ],
            thresholds: {
                statements: 90,
                branches: 78,
                functions: 90,
                lines: 95,
            },
        },
    },
});
