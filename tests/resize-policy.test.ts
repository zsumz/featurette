import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    FakeClock,
    runFilm,
    StringRenderer,
    TerminalTooSmallError,
    type Frame,
    type PlaybackModeChangeEvent,
    type TerminalInfo,
} from '../dist/index.js';
import { createFakeResizeSource } from './helpers.js';

test('letterbox preserves the stage and centers it in the resized terminal', async () => {
    const film = defineFilm({ title: 'Letterbox', resize: 'letterbox' });
    const resizeSource = createFakeResizeSource(terminal(4, 2));
    const frames: Frame[] = [];
    let stage = { columns: 0, rows: 0 };

    film.scene('frame', async ($) => {
        $.draw.text(0, 0, 'X');
        resizeSource.resize({ columns: 8, rows: 4 });
        await $.beat(1);
        stage = $.screen.size;
        await $.cut();
    });

    await runFilm(film, {
        clock: new FakeClock(),
        renderer: {
            render: (frame) => {
                frames.push(frame);
            },
        },
        resizeSource,
        terminal: resizeSource.current(),
    });

    const frame = frames.at(-1);
    assert.ok(frame);
    assert.deepEqual(stage, { columns: 4, rows: 2 });
    assert.equal(frame.columns, 8);
    assert.equal(frame.rows, 4);
    assert.equal(frame.cells[1]?.[2]?.char, 'X');
});

test('crop preserves the stage and clips it from the top-left', async () => {
    const film = defineFilm({ title: 'Crop', resize: 'crop' });
    const resizeSource = createFakeResizeSource(terminal(4, 2));
    const frames: Frame[] = [];
    let stage = { columns: 0, rows: 0 };

    film.scene('frame', async ($) => {
        $.draw.text(0, 0, 'A');
        $.draw.text(3, 1, 'X');
        resizeSource.resize({ columns: 2, rows: 1 });
        await $.beat(1);
        stage = $.screen.size;
        await $.cut();
    });

    await runFilm(film, {
        clock: new FakeClock(),
        renderer: {
            render: (frame) => {
                frames.push(frame);
            },
        },
        resizeSource,
        terminal: resizeSource.current(),
    });

    const frame = frames.at(-1);
    assert.ok(frame);
    assert.deepEqual(stage, { columns: 4, rows: 2 });
    assert.equal(frame.columns, 2);
    assert.equal(frame.rows, 1);
    assert.equal(frame.cells[0]?.[0]?.char, 'A');
    assert.equal(frame.toString().includes('X'), false);
});

test('live resize rechecks minSize and rejects resize-required playback', async () => {
    const film = defineFilm({
        title: 'Minimum Room',
        minSize: { columns: 20, rows: 5 },
    });
    const resizeSource = createFakeResizeSource(terminal(20, 5));

    film.scene('room', async ($) => {
        resizeSource.resize({ columns: 19, rows: 5 });
        await $.beat(1);
    });

    await assert.rejects(
        runFilm(film, {
            clock: new FakeClock(),
            renderer: new StringRenderer(),
            resizeSource,
            terminal: resizeSource.current(),
        }),
        (error: unknown) => {
            assert.ok(error instanceof TerminalTooSmallError);
            assert.equal(error.actual.columns, 19);
            assert.equal(error.actual.rows, 5);
            return true;
        },
    );
});

test('live too-small resize switches the remaining film to transcript mode', async () => {
    const film = defineFilm({
        title: 'Transcript Fallback',
        minSize: { columns: 20, rows: 5 },
        tooSmall: 'transcript',
        voices: { process: { speed: 0 } },
    });
    const resizeSource = createFakeResizeSource(terminal(20, 5));
    const renderer = new StringRenderer();
    const changes: PlaybackModeChangeEvent[] = [];

    film.scene('room', async ($) => {
        resizeSource.resize({ columns: 12, rows: 4 });
        await $.beat(1);
        await $.say('process', 'still readable');
    });

    const result = await runFilm(film, {
        clock: new FakeClock(),
        onModeChange: (event) => {
            changes.push(event);
        },
        renderer,
        resizeSource,
        terminal: resizeSource.current(),
    });

    assert.equal(result.mode, 'transcript');
    assert.equal(result.tooSmall, true);
    assert.equal(result.fallbackReason, 'too-small');
    assert.match(renderer.transcriptText(), /still readable/);
    assert.deepEqual(changes.map(({ previous, current, reason }) => ({ previous, current, reason })), [{
        previous: 'visual',
        current: 'transcript',
        reason: 'too-small',
    }]);
});

test('transcript resize policy switches modes even when the terminal remains large enough', async () => {
    const film = defineFilm({
        title: 'Resize Transcript',
        minSize: { columns: 10, rows: 3 },
        resize: 'transcript',
    });
    const resizeSource = createFakeResizeSource(terminal(20, 5));

    film.scene('room', async ($) => {
        resizeSource.resize({ columns: 18, rows: 5 });
        await $.beat(1);
    });

    const result = await runFilm(film, {
        clock: new FakeClock(),
        renderer: new StringRenderer(),
        resizeSource,
        terminal: resizeSource.current(),
    });

    assert.equal(result.mode, 'transcript');
    assert.equal(result.tooSmall, false);
    assert.equal(result.fallbackReason, 'resize');
});

function terminal(columns: number, rows: number): TerminalInfo {
    return {
        columns,
        rows,
        isTTY: true,
        colorDepth: 24,
        unicode: true,
    };
}
