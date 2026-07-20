import type { NpmFixture, SmokeContext } from 'smoque';

export async function assertInstalledRuntime(
    t: SmokeContext,
    fixture: NpmFixture,
): Promise<void> {
    await assertPublicSurface(t, fixture);
    await assertCommonJsSurface(t, fixture);
    await assertMainExportRunsFilm(t, fixture);
    await assertMainExportHandlesResize(t, fixture);
    await assertTestExportRendersScene(t, fixture);
    await assertNodeExportInspectsTerminal(t, fixture);
    await assertNodeExportPlaysWithoutAnsi(t, fixture);
}

async function assertCommonJsSurface(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package works through CommonJS require', async () => {
        await fixture.node.inline(`
            import { createRequire } from 'node:module';

            const require = createRequire(import.meta.url);
            const featurette = require('featurette');
            const featuretteNode = require('featurette/node');
            const featuretteTest = require('featurette/test');
            const film = featurette.defineFilm({ title: 'CommonJS Package' });

            film.scene('one', async ($) => {
                await $.say('process', 'required and running');
            });

            const rendered = await featuretteTest.renderScene(film, 'one', {
                terminal: { columns: 32, rows: 8 },
            });
            const report = featuretteNode.inspectTerminal({
                input: { isTTY: false, resume() { return this; } },
                output: {
                    isTTY: false,
                    columns: 32,
                    rows: 8,
                    write() { return true; },
                    getColorDepth() { return 1; },
                },
                env: { TERM: 'dumb', LANG: 'C' },
            });

            if (!rendered.transcript.includes('required and running')) {
                throw new Error('CommonJS test export did not render the film');
            }

            if (report.verdict !== 'limited') {
                throw new Error('CommonJS node export did not inspect the terminal');
            }
        `);
    });
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
                await $.effects.moveAlong({
                    path: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }],
                    duration: 20,
                    frames: 3,
                    layer: 'packet',
                    draw: ({ point, layer }) => {
                        layer.text(point.x, point.y, '*');
                    },
                });
                await $.say('process', 'packed and alive');
            });

            const result = await runFilm(film, {
                renderer,
                terminal: { columns: 32, rows: 8 },
                skip: true,
            });

            if (result.mode !== 'visual' || result.termination !== 'completed') {
                throw new Error('expected completed visual playback');
            }

            if (!renderer.lastFrame().includes('packed and alive')) {
                throw new Error('main export did not render the film');
            }
        `);
    });
}

async function assertMainExportHandlesResize(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package handles resize-aware scene redraws', async () => {
        await fixture.node.inline(`
            import { EventEmitter } from 'node:events';
            import { FakeClock, StringRenderer, defineFilm, runFilm } from 'featurette';

            const emitter = new EventEmitter();
            let current = {
                columns: 20,
                rows: 5,
                isTTY: true,
                colorDepth: 24,
                unicode: true,
            };
            const resizeSource = {
                current: () => current,
                onResize: (handler) => {
                    emitter.on('resize', handler);
                    return () => emitter.off('resize', handler);
                },
            };
            const film = defineFilm({ title: 'Package Resize' });
            const renderer = new StringRenderer();

            film.scene('one', async ($) => {
                $.onResize(async ({ current }) => {
                    await $.clear();
                    $.draw.text(0, 0, 'resized ' + current.columns);
                    await $.cut();
                });

                $.draw.text(0, 0, 'before');
                await $.cut();
                current = { ...current, columns: 12, rows: 4 };
                emitter.emit('resize');
                await $.beat(1);
            });

            const result = await runFilm(film, {
                renderer,
                resizeSource,
                terminal: resizeSource.current(),
                clock: new FakeClock(),
            });

            if (result.terminal.columns !== 12 || !renderer.lastFrame().includes('resized 12')) {
                throw new Error('main export did not process resize redraws');
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

async function assertNodeExportPlaysWithoutAnsi(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package plays visual output without ansi escapes', async () => {
        await fixture.node.inline(`
            import { EventEmitter } from 'node:events';
            import { defineFilm } from 'featurette';
            import { playCli } from 'featurette/node';

            const input = new EventEmitter();
            input.isTTY = true;
            input.isRaw = false;
            input.rawModes = [];
            input.resume = () => input;
            input.setRawMode = (mode) => {
                input.rawModes.push(mode);
                input.isRaw = mode;
                return input;
            };

            const chunks = [];
            const output = {
                isTTY: true,
                columns: 24,
                rows: 6,
                write(chunk) {
                    chunks.push(String(chunk));
                    return true;
                },
                getColorDepth() {
                    return 24;
                },
            };
            const film = defineFilm({
                title: 'No ANSI',
                voices: { process: { speed: 0 } },
            });

            film.scene('one', async ($) => {
                await $.say('process', 'plain package playback');
            });

            await playCli(film, {
                argv: ['--no-ansi', '--skip'],
                input,
                output,
            });

            const text = chunks.join('');

            if (text.includes('\\x1b[') || !text.includes('plain package playback')) {
                throw new Error('node export did not play without ansi escapes');
            }
        `);
    });
}
