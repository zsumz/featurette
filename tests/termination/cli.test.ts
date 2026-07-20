import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    InputController,
    StringRenderer,
} from '../../dist/index.js';
import { play, playCli } from '../../dist/node.js';
import {
    createFakeInput,
    createFakeOutput,
    flushPromises,
} from '../helpers.js';
import { SuspendedClock } from './helpers.js';

test('playCli leaves the process exit code unchanged for an authored quit', async () => {
    const previousExitCode = process.exitCode;
    const film = defineFilm({ title: 'Authored Quit' });
    film.scene('one', ($) => $.quit());

    try {
        process.exitCode = undefined;
        const result = await playCli(film, {
            argv: [],
            renderer: new StringRenderer(),
            terminal: { columns: 20, rows: 5 },
        });

        assert.equal(result.termination, 'quit');
        assert.equal(process.exitCode, undefined);
    } finally {
        process.exitCode = previousExitCode;
    }
});

test('playCli applies exit code 130 after an interrupt-driven quit', async () => {
    const previousExitCode = process.exitCode;
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true, columns: 20, rows: 5 });
    const film = defineFilm({ title: 'Interrupted Quit' });
    film.onInterrupt(($) => $.quit());
    film.scene('one', async ($) => $.wait(60_000));

    try {
        process.exitCode = undefined;
        const playback = playCli(film, {
            argv: ['--no-ansi', '--no-alt-screen'],
            clock: new SuspendedClock(),
            input,
            output,
        });

        await flushPromises();
        input.emit('data', '\u0003');
        const result = await playback;

        assert.equal(result.termination, 'interrupted');
        assert.equal(process.exitCode, 130);
        assert.deepEqual(input.rawModes, [true, false]);
        assert.equal(input.listenerCount('data'), 0);
    } finally {
        process.exitCode = previousExitCode;
    }
});

test('play remains process-neutral and honors a controller with a custom renderer', async () => {
    const previousExitCode = process.exitCode;
    const controller = new InputController();
    const film = defineFilm({ title: 'Embedded Interrupt' });
    film.onInterrupt(($) => $.quit());
    film.scene('one', async ($) => $.wait(60_000));

    try {
        process.exitCode = undefined;
        const playback = play(film, {
            clock: new SuspendedClock(),
            controller,
            renderer: new StringRenderer(),
            terminal: { columns: 20, rows: 5 },
        });

        await flushPromises();
        await controller.emitCtrlC();
        const result = await playback;

        assert.equal(result.termination, 'interrupted');
        assert.equal(process.exitCode, undefined);
    } finally {
        process.exitCode = previousExitCode;
    }
});
