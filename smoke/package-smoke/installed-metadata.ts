import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { NpmFixture, SmokeContext } from 'smoque';

interface InstalledPackageJson {
    name?: string;
    version?: string;
    description?: string;
    type?: string;
    license?: string;
    author?: string;
    repository?: {
        type?: string;
        url?: string;
    };
    bugs?: {
        url?: string;
    };
    homepage?: string;
    keywords?: string[];
    sideEffects?: boolean;
    main?: string;
    module?: string;
    files?: string[];
    publishConfig?: {
        access?: string;
    };
    exports?: Record<string, unknown>;
    types?: string;
    engines?: {
        node?: string;
    };
}

const expectedFiles = [
    'dist',
    'README.md',
    'USAGE.md',
    'LICENSE',
    'featurette-logo.svg',
] as const;

export async function assertInstalledMetadata(
    t: SmokeContext,
    fixture: NpmFixture,
): Promise<void> {
    await t.step('installed package metadata matches the public release shape', async () => {
        const packageJson = await readInstalledPackageJson(fixture);

        assert.equal(packageJson.name, 'featurette');
        assert.match(packageJson.version ?? '', /^0\.1\.0(?:$|-)/u);
        assert.equal(packageJson.description, 'A TypeScript framework for making short films that run in the terminal.');
        assert.equal(packageJson.type, 'module');
        assert.equal(packageJson.license, 'MIT');
        assert.equal(packageJson.author, 'zsumz <shawn@zsumz.com>');
        assert.deepEqual(packageJson.repository, {
            type: 'git',
            url: 'git+https://github.com/zsumz/featurette.git',
        });
        assert.equal(packageJson.bugs?.url, 'https://github.com/zsumz/featurette/issues');
        assert.equal(packageJson.homepage, 'https://github.com/zsumz/featurette#readme');
        assert.equal(packageJson.sideEffects, false);
        assert.equal(packageJson.main, './dist/index.cjs');
        assert.equal(packageJson.module, './dist/index.js');
        assert.deepEqual(packageJson.files, [...expectedFiles]);
        assert.equal(packageJson.publishConfig?.access, 'public');
        assert.deepEqual(Object.keys(packageJson.exports ?? {}).sort(), ['.', './node', './test']);
        assert.equal(packageJson.types, './dist/index.d.ts');
        assert.equal(packageJson.engines?.node, '>=20.19');
        assert.ok((packageJson.keywords ?? []).includes('terminal-film'));
        assert.ok((packageJson.keywords ?? []).includes('typescript'));
    });
}

async function readInstalledPackageJson(fixture: NpmFixture): Promise<InstalledPackageJson> {
    const source = await readFile(fixture.path('node_modules', 'featurette', 'package.json'), 'utf8');
    return JSON.parse(source) as InstalledPackageJson;
}
