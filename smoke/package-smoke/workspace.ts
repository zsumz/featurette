import { resolve } from 'node:path';
import type { NpmFixture, PathRef, SmokeContext } from 'smoque';

interface NpmPackJson {
    filename: string;
    files: Array<{ path: string }>;
}

export interface PackageSmokeWorkspace {
    root: PathRef;
    packed: string;
    fixtureDir: string;
    npmCache: string;
}

export interface PackedFeaturetteTarball {
    filename: string;
    files: string[];
    path: string;
}

export async function createPackageSmokeWorkspace(t: SmokeContext): Promise<PackageSmokeWorkspace> {
    const root = t.repoRoot();
    const work = await t.tempDir('featurette-package');

    return {
        root,
        packed: work.path('packed'),
        fixtureDir: work.path('fixture'),
        npmCache: work.path('npm-cache'),
    };
}

export async function assertRequiredTools(t: SmokeContext): Promise<void> {
    await t.step('required tools are available', async () => {
        await t.tools.node({ minVersion: 22 });
        await t.tools.npm({ minVersion: 10 });
    });
}

export async function buildPackage(t: SmokeContext, root: PathRef): Promise<void> {
    await t.step('build package', async () => {
        await t.cmd('npm', ['run', 'build'], { cwd: root });
    });
}

export async function preparePackDestination(
    t: SmokeContext,
    workspace: PackageSmokeWorkspace,
): Promise<void> {
    await t.step('prepare pack destination', async () => {
        await t.fs.mkdir(workspace.packed);
        await t.fs.mkdir(workspace.npmCache);
    });
}

export async function packFeaturettePackage(
    t: SmokeContext,
    workspace: PackageSmokeWorkspace,
): Promise<PackedFeaturetteTarball> {
    return await t.step('pack package artifact', async () => {
        const result = await t.cmd(
            'npm',
            ['pack', '--json', '--ignore-scripts', '--pack-destination', workspace.packed],
            {
                cwd: workspace.root,
                env: {
                    NPM_CONFIG_CACHE: workspace.npmCache,
                },
            },
        );
        const [packResult] = JSON.parse(result.stdout) as [NpmPackJson];

        return {
            filename: packResult.filename,
            files: packResult.files.map((file) => file.path),
            path: resolve(workspace.packed, packResult.filename),
        };
    });
}

export async function createCleanFixture(
    t: SmokeContext,
    workspace: PackageSmokeWorkspace,
): Promise<NpmFixture> {
    return await t.step('create clean npm fixture', async () =>
        await t.npm.fixture({
            dir: workspace.fixtureDir,
            packageJson: {
                private: true,
                type: 'module',
                dependencies: {},
            },
        }));
}

export async function installPackedPackage(
    t: SmokeContext,
    fixture: NpmFixture,
    tarball: PackedFeaturetteTarball,
): Promise<void> {
    await t.step('install packed package', async () => {
        await fixture.install(tarball.path, {
            scripts: 'ignore',
            audit: false,
            fund: false,
            packageLock: false,
        });
    });
}
