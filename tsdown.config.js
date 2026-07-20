import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/node.ts',
        'src/test.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    target: 'node20',
    tsconfig: 'tsconfig.build.json',
    hash: false,
    inputOptions(options) {
        delete options.define;
        delete options.inject;
    },
});
