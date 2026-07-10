import type { NpmFixture, SmokeContext } from 'smoque';

export async function assertInstalledRuntime(
    t: SmokeContext,
    fixture: NpmFixture,
): Promise<void> {
    await assertPublicSurface(t, fixture);
    await assertMainExportRunsFilm(t, fixture);
    await assertTestExportRendersScene(t, fixture);
    await assertNodeExportInspectsTerminal(t, fixture);
}

async function assertPublicSurface(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package exposes the public surface', async () => {
        const pkg = fixture.package('featurette');
        await pkg.toExposeOnly(['.', './node', './test']);
        await pkg.toHaveTypes(['.', './node', './test']);
    });
}

async function assertMainExportRunsFilm(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package runs a film through the main export', async () => {
        await fixture.node.inline(`
            import { StringRenderer, defineFilm, runFilm } from 'featurette';

            const film = defineFilm({ title: 'Package Smoke' });
            const renderer = new StringRenderer();

            film.scene('one', async ($) => {
                await $.say('process', 'packed and alive');
            });

            const result = await runFilm(film, {
                renderer,
                terminal: { columns: 32, rows: 8 },
                skip: true,
            });

            if (result.mode !== 'visual') {
                throw new Error('expected visual playback mode');
            }

            if (!renderer.lastFrame().includes('packed and alive')) {
                throw new Error('main export did not render the film');
            }
        `);
    });
}

async function assertTestExportRendersScene(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package exposes deterministic test helpers', async () => {
        await fixture.node.inline(`
            import { defineFilm } from 'featurette';
            import { renderScene } from 'featurette/test';

            const film = defineFilm({ title: 'Package Test Export' });

            film.scene('one', async ($) => {
                await $.say('process', 'test export works');
            });

            const result = await renderScene(film, 'one', {
                terminal: { columns: 32, rows: 8 },
            });

            if (!result.transcript.includes('test export works')) {
                throw new Error('test export did not render transcript output');
            }
        `);
    });
}

async function assertNodeExportInspectsTerminal(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package exposes node terminal helpers', async () => {
        await fixture.node.inline(`
            import { inspectTerminal } from 'featurette/node';

            const report = inspectTerminal({
                input: { isTTY: false, resume() { return this; } },
                output: {
                    isTTY: false,
                    columns: 20,
                    rows: 5,
                    write() { return true; },
                    getColorDepth() { return 1; },
                },
                env: { TERM: 'dumb', LANG: 'C' },
                minSize: { columns: 80, rows: 24 },
            });

            if (report.verdict !== 'limited' || report.sizeOk !== false) {
                throw new Error('node export did not inspect terminal capability');
            }
        `);
    });
}
