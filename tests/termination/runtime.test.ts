import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    InputController,
    runFilm,
    StringRenderer,
} from '../../dist/index.js';
import { flushPromises } from '../helpers.js';
import { SuspendedClock } from './helpers.js';

test('quit from a ctrl-c input binding reports interrupted termination', async () => {
    const film = defineFilm({ title: 'Input Interrupt Quit' });
    const controller = new InputController();

    film.scene('waiting', async ($) => {
        $.input.onCtrlC(() => $.quit());
        await $.wait(60_000);
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer: new StringRenderer(),
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    await controller.emitCtrlC();
    const result = await playback;

    assert.equal(result.termination, 'interrupted');
});

test('quit from an ordinary key binding reports authored termination', async () => {
    const film = defineFilm({ title: 'Input Key Quit' });
    const controller = new InputController();

    film.scene('waiting', async ($) => {
        $.input.onKey('q', () => $.quit());
        await $.wait(60_000);
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer: new StringRenderer(),
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    await controller.emitKey({ name: 'q' });
    const result = await playback;

    assert.equal(result.termination, 'quit');
});

test('quit from a ctrl-c key binding reports interrupted termination', async () => {
    const film = defineFilm({ title: 'Input Key Interrupt' });
    const controller = new InputController();

    film.scene('waiting', async ($) => {
        $.input.onKey('c', () => $.quit());
        await $.wait(60_000);
    });

    const playback = runFilm(film, {
        clock: new SuspendedClock(),
        input: controller,
        renderer: new StringRenderer(),
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    await controller.emitKey({ name: 'c', ctrl: true });
    const result = await playback;

    assert.equal(result.termination, 'interrupted');
});
