import type { NpmFixture, SmokeContext } from 'smoque';

export async function assertInstalledLifecycle(
    t: SmokeContext,
    fixture: NpmFixture,
): Promise<void> {
    await assertInputCleanup(t, fixture);
    await assertInterruptControl(t, fixture);
    await assertResizeFallback(t, fixture);
}

async function assertInputCleanup(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package restores fresh idle stdin after visual playback', async () => {
        await fixture.node.inline(`
            import { EventEmitter } from 'node:events';
            import { defineFilm } from 'featurette';
            import { playCli } from 'featurette/node';

            const input = new EventEmitter();
            let pauseCalls = 0;
            input.isTTY = true;
            input.isRaw = false;
            input.readableFlowing = null;
            input.isPaused = () => false;
            input.pause = () => {
                pauseCalls += 1;
                input.readableFlowing = false;
                return input;
            };
            input.resume = () => {
                input.readableFlowing = true;
                return input;
            };
            input.setRawMode = (mode) => {
                input.isRaw = mode;
                return input;
            };

            const output = {
                isTTY: true,
                columns: 20,
                rows: 5,
                write() { return true; },
                getColorDepth() { return 24; },
            };
            const film = defineFilm({ title: 'Input Cleanup' });
            film.scene('one', async ($) => $.cut());

            await playCli(film, {
                argv: ['--no-ansi', '--skip'],
                input,
                output,
            });

            if (input.readableFlowing !== false || pauseCalls !== 1 || input.isRaw) {
                throw new Error('visual playback did not restore stdin ownership');
            }
        `);
    });
}

async function assertInterruptControl(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package handles quit from an interrupt handler', async () => {
        await fixture.node.inline(`
            import {
                InputController,
                StringRenderer,
                defineFilm,
                runFilm,
            } from 'featurette';

            const controller = new InputController();
            const renderer = new StringRenderer();
            const clock = {
                now: () => 0,
                wait: () => new Promise(() => {}),
            };
            const film = defineFilm({ title: 'Interrupt Control' });

            film.onInterrupt(($) => $.quit());
            film.scene('one', async ($) => $.wait(60_000));

            const playback = runFilm(film, {
                clock,
                input: controller,
                renderer,
                terminal: { columns: 20, rows: 5 },
            });

            await new Promise((resolve) => setImmediate(resolve));
            await controller.emitCtrlC();
            const result = await playback;

            if (result.scenesPlayed.length !== 0) {
                throw new Error('interrupt quit did not stop the active scene');
            }
        `);
    });
}

async function assertResizeFallback(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.step('installed package applies live resize fallback policy', async () => {
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
            const film = defineFilm({
                title: 'Resize Fallback',
                minSize: { columns: 20, rows: 5 },
                tooSmall: 'transcript',
            });

            film.scene('one', async ($) => {
                current = { ...current, columns: 12, rows: 4 };
                emitter.emit('resize');
                await $.beat(1);
            });

            const result = await runFilm(film, {
                clock: new FakeClock(),
                renderer: new StringRenderer(),
                resizeSource,
                terminal: resizeSource.current(),
            });

            if (result.mode !== 'transcript' || result.fallbackReason !== 'too-small') {
                throw new Error('live resize did not apply transcript fallback');
            }
        `);
    });
}
