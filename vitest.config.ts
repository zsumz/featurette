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
        },
    },
});
