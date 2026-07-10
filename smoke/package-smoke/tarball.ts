import { expect, type SmokeContext } from 'smoque';
import type { PackedFeaturetteTarball } from './workspace.ts';

const requiredPackageEntries = [
    'package/dist/index.d.ts',
    'package/dist/index.js',
    'package/dist/node.d.ts',
    'package/dist/node.js',
    'package/dist/test.d.ts',
    'package/dist/test.js',
    'package/package.json',
] as const;

const forbiddenLocalEntries = [
    'package/src/index.ts',
    'package/tests/rendering.test.ts',
    'package/smoke/package.smoke.ts',
    'package/smoke/package-smoke/workspace.ts',
    'package/smoke/AGENTS.md',
    'package/scripts/doctor.mjs',
    'package/eslint.config.js',
    'package/vitest.config.ts',
] as const;

const forbiddenLocalPrefixes = [
    'package/scripts/',
    'package/smoke/',
    'package/src/',
    'package/tests/',
] as const;

export async function assertTarballShape(
    t: SmokeContext,
    tarball: PackedFeaturetteTarball,
): Promise<void> {
    await assertRequiredEntries(t, tarball);
    await assertNoPublishClutter(t, tarball);
    await assertNoLocalEntries(t, tarball);
}

async function assertRequiredEntries(
    t: SmokeContext,
    tarball: PackedFeaturetteTarball,
): Promise<void> {
    await t.step('tarball contains public runtime files', async () => {
        await expect.archive(tarball.path).toContainEntries([...requiredPackageEntries]);
    });
}

async function assertNoPublishClutter(
    t: SmokeContext,
    tarball: PackedFeaturetteTarball,
): Promise<void> {
    await t.step('tarball excludes source maps', () => {
        const forbidden = tarball.files.filter((file) =>
            file.endsWith('.map'));

        if (forbidden.length > 0) {
            throw new Error(`Packed package should not include publish-only clutter: ${forbidden.join(', ')}`);
        }
    });
}

async function assertNoLocalEntries(
    t: SmokeContext,
    tarball: PackedFeaturetteTarball,
): Promise<void> {
    await t.step('tarball excludes source, tests, smoke, and local scripts', async () => {
        const forbidden = tarball.files.filter((file) =>
            forbiddenLocalPrefixes.some((prefix) => file.startsWith(prefix)));

        if (forbidden.length > 0) {
            throw new Error(`Packed package should not include local-only files: ${forbidden.join(', ')}`);
        }

        await expect.archive(tarball.path).not.toContainEntries([...forbiddenLocalEntries]);
    });
}
