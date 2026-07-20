import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    InputController,
    runFilm,
    StringRenderer,
    type Clock,
} from '../dist/index.js';
import { renderFilm } from '../dist/test.js';
import { flushPromises } from './helpers.js';

test('skipScene marks the current scene played and continues', async () => {
    const film = defineFilm({ title: 'Skip Control' });

    film.scene('setup', async ($) => {
        await $.say('process', 'before skip');
        $.skipScene();
    });

    film.scene('after', async ($) => {
        await $.say('process', 'after skip');
    });

    const result = await renderFilm(film, {
        terminal: { columns: 32, rows: 6 },
    });

    assert.deepEqual(result.result.scenesPlayed, ['setup', 'after']);
    assert.match(result.transcript, /before skip/);
    assert.match(result.transcript, /after skip/);
});

test('quit stops playback before later scenes run', async () => {
    const film = defineFilm({ title: 'Quit Control' });

    film.scene('opening', async ($) => {
        await $.say('process', 'goodbye');
        $.quit();
    });

    film.scene('never', async ($) => {
        await $.say('process', 'should not render');
    });

    const result = await renderFilm(film, {
        terminal: { columns: 32, rows: 6 },
    });

    assert.deepEqual(result.result.scenesPlayed, []);
    assert.match(result.transcript, /goodbye/);
    assert.doesNotMatch(result.transcript, /should not render/);
});

test('quit from a film interrupt handler stops a suspended scene cleanly', async () => {
    const film = defineFilm({
        title: 'Interrupt Quit',
        voices: { process: { speed: 0 } },
    });
    const controller = new InputController();
    const renderer = new StringRenderer();

    film.onInterrupt(async ($) => {
        await $.say('process', 'graceful goodbye');
        $.quit();
    });
    film.scene('waiting', async ($) => {
        await $.wait(60_000);
        await $.say('process', 'too late');
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer,
        terminal: { columns: 40, rows: 8 },
    });

    await flushPromises();
    await controller.emitCtrlC();
    const result = await playback;

    assert.deepEqual(result.scenesPlayed, []);
    assert.match(renderer.transcriptText(), /graceful goodbye/);
    assert.doesNotMatch(renderer.transcriptText(), /too late/);
});

test('skipScene from a film interrupt handler advances to the next scene', async () => {
    const film = defineFilm({ title: 'Interrupt Skip' });
    const controller = new InputController();
    const renderer = new StringRenderer();

    film.onInterrupt(($) => {
        $.skipScene();
    });
    film.scene('waiting', async ($) => {
        await $.wait(60_000);
    });
    film.scene('after', async ($) => {
        $.draw.text(0, 0, 'continued');
        await $.cut();
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer,
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    await controller.emitCtrlC();
    const result = await playback;

    assert.deepEqual(result.scenesPlayed, ['waiting', 'after']);
    assert.match(renderer.lastFrame(), /continued/);
});

test('runFilm preserves caller input handlers and disposes scene handlers', async () => {
    const film = defineFilm({ title: 'Input Ownership' });
    const controller = new InputController();
    const seen: string[] = [];

    controller.onKey('space', () => {
        seen.push('owner');
    });
    film.scene('one', async ($) => {
        $.input.onKey('space', () => {
            seen.push('scene');
        });
        await $.cut();
    });

    await runFilm(film, {
        input: controller,
        renderer: new StringRenderer(),
        terminal: { columns: 20, rows: 4 },
    });
    await controller.emitKey({ name: 'space' });

    assert.deepEqual(seen, ['owner']);
});

test('skipScene from a key handler advances to the next scene', async () => {
    const film = defineFilm({ title: 'Key Skip' });
    const controller = new InputController();
    const renderer = new StringRenderer();

    film.scene('waiting', async ($) => {
        $.input.onKey('space', () => $.skipScene());
        await $.wait(60_000);
    });
    film.scene('after', async ($) => {
        $.draw.text(0, 0, 'continued');
        await $.cut();
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer,
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    await controller.emitKey({ name: 'space' });
    const result = await playback;

    assert.deepEqual(result.scenesPlayed, ['waiting', 'after']);
    assert.match(renderer.lastFrame(), /continued/);
});

test('errors from key handlers fail the active scene', async () => {
    const film = defineFilm({ title: 'Key Failure' });
    const controller = new InputController();

    film.scene('waiting', async ($) => {
        $.input.onKey('space', () => {
            throw new Error('input failed');
        });
        await $.wait(60_000);
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer: new StringRenderer(),
        terminal: { columns: 20, rows: 4 },
    });
    const failedPlayback = assert.rejects(playback, /input failed/);

    await flushPromises();
    await controller.emitKey({ name: 'space' });
    await failedPlayback;
});

class SuspendedClock implements Clock {
    public now(): number {
        return 0;
    }

    public async wait(): Promise<void> {
        await new Promise<void>(() => undefined);
    }
}
