import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    FakeClock,
    type Frame,
    type RenderOptions,
} from '../dist/index.js';
import { playCli } from '../dist/node.js';
import {
    createFakeInput,
    createFakeOutput,
    createFakeResizeSource,
} from './helpers.js';

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
    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 1);
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

test('playCli leaves visual mode cleanly when resize falls back to transcript', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true, columns: 20, rows: 5 });
    const resizeSource = createFakeResizeSource({
        columns: 20,
        rows: 5,
        isTTY: true,
        colorDepth: 24,
        unicode: true,
    });
    const film = defineFilm({
        title: 'Live Transcript',
        minSize: { columns: 20, rows: 5 },
        tooSmall: 'transcript',
        voices: { process: { speed: 0 } },
    });

    film.scene('one', async ($) => {
        $.draw.text(0, 0, 'visual frame');
        await $.cut();
        resizeSource.resize({ columns: 12, rows: 4 });
        await $.beat(1);
        await $.say('process', 'plain ending');
    });

    const result = await playCli(film, {
        argv: [],
        clock: new FakeClock(),
        input,
        output,
        resizeSource,
    });

    assert.equal(result.mode, 'transcript');
    assert.equal(result.fallbackReason, 'too-small');
    assert.match(output.text(), /visual frame/);
    assert.match(output.text(), /process: plain ending/);
    assert.deepEqual(input.rawModes, [true, false]);
    assert.equal(input.pauseCalls, 1);
});
