import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    FakeClock,
    InputController,
    type Frame,
    type RenderOptions,
} from '../dist/index.js';
import { playCli, TerminalSession } from '../dist/node.js';
import { createFakeInput, createFakeOutput, flushPromises } from './helpers.js';

test('playCli visual mode owns and restores the terminal lifecycle', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true, columns: 32, rows: 8 });
    const film = defineFilm({
        title: 'TTY Playback',
        voices: { process: { speed: 0 } },
    });

    film.scene('one', async ($) => {
        await $.say('process', 'tty mode');
    });

    const result = await playCli(film, {
        argv: ['--no-alt-screen', '--skip'],
        input,
        output,
    });

    assert.equal(result.mode, 'visual');
    assert.deepEqual(result.scenesPlayed, ['one']);
    assert.deepEqual(input.rawModes, [true, false]);
    assert.match(output.text(), /tty mode/);
    assert.equal(output.text().includes('\x1b[?25l'), true);
    assert.equal(output.text().includes('\x1b[?25h'), true);
    assert.equal(output.text().includes('\x1b[?1049h'), false);
});

test('playCli transcript mode writes plain transcript output', async () => {
    const film = defineFilm({ title: 'CLI Transcript' });
    const output = createFakeOutput({ isTTY: false });

    film.scene('one', async ($) => {
        await $.say('process', 'plain words');
    });

    const result = await playCli(film, {
        argv: ['--transcript'],
        output,
    });

    assert.equal(result.mode, 'transcript');
    assert.match(output.text(), /plain words/);
    assert.equal(output.text().includes('\x1b['), false);
});

test('playCli no-ansi mode writes visual frames without terminal escape sequences', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true, columns: 24, rows: 6 });
    const film = defineFilm({
        title: 'Plain TTY',
        voices: { process: { speed: 0 } },
    });

    film.scene('one', async ($) => {
        await $.say('process', 'plain visual words');
    });

    const result = await playCli(film, {
        argv: ['--no-ansi', '--skip'],
        input,
        output,
        terminalRenderer: { ansi: true },
    });

    assert.equal(result.mode, 'visual');
    assert.match(output.text(), /plain visual words/);
    assert.equal(output.text().includes('\x1b['), false);
    assert.deepEqual(input.rawModes, [true, false]);
});

test('playCli applies scene, speed, color, and unicode flags', async () => {
    const clock = new FakeClock();
    const renderOptions: RenderOptions[] = [];
    const renderer = {
        render(_frame: Frame, options: RenderOptions): void {
            renderOptions.push(options);
        },
    };
    const film = defineFilm({
        title: 'CLI Flags',
        voices: { process: { speed: 0 } },
    });

    film.scene('first', async ($) => {
        await $.say('process', 'first');
    });
    film.scene('second', async ($) => {
        await $.beat(100);
        await $.say('process', 'second');
    });

    const result = await playCli(film, {
        argv: ['--scene', 'second', '--speed', '2', '--no-color', '--no-unicode'],
        clock,
        renderer,
        terminal: { columns: 32, rows: 8 },
    });

    assert.deepEqual(result.scenesPlayed, ['second']);
    assert.equal(result.elapsed, 50);
    assert.deepEqual(renderOptions.at(-1), {
        color: false,
        palette: undefined,
        unicode: false,
    });
});

test('non-TTY playCli falls back to transcript output', async () => {
    const film = defineFilm({ title: 'Pipe Safe' });
    const output = createFakeOutput({ isTTY: false });

    film.scene('one', async ($) => {
        await $.say('process', 'pipe safe');
    });

    const result = await playCli(film, {
        argv: [],
        output,
    });

    assert.equal(result.mode, 'transcript');
    assert.equal(result.fallbackReason, 'non-tty');
    assert.match(output.text(), /pipe safe/);
});

test('terminal session restores cursor, alt screen, raw mode, and listeners', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true });
    const controller = new InputController();
    const session = new TerminalSession({ input, output });
    const seen: string[] = [];

    controller.onKey('q', () => {
        seen.push('q');
    });

    session.enterAltScreen();
    session.hideCursor();
    session.useRawMode();
    session.bindInput(controller);
    input.emit('keypress', 'q', { name: 'q' });
    await flushPromises();
    session.restore();

    assert.deepEqual(input.rawModes, [true, false]);
    assert.deepEqual(seen, ['q']);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(output.text().includes('\x1b[?1049h'), true);
    assert.equal(output.text().includes('\x1b[?1049l'), true);
    assert.equal(output.text().includes('\x1b[?25l'), true);
    assert.equal(output.text().includes('\x1b[?25h'), true);
    assert.equal(output.text().includes('\x1b[0m'), true);
});

test('TerminalSession hard-exits through an injectable exit hook on second ctrl-c', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true });
    const exits: number[] = [];
    const hardExits: string[] = [];
    const controller = new InputController();
    const session = new TerminalSession({
        input,
        output,
        exit: (code) => {
            exits.push(code);
        },
    });

    session.bindInput(controller, {
        hardExit: () => {
            hardExits.push('restore');
            session.restore();
        },
    });

    input.emit('keypress', '\u0003', { name: 'c', ctrl: true });
    input.emit('keypress', '\u0003', { name: 'c', ctrl: true });
    await flushPromises();

    assert.deepEqual(hardExits, ['restore']);
    assert.deepEqual(exits, [130]);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(output.text().includes('\x1b[0m'), true);
});
