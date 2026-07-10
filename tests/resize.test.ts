import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm, FakeClock, runFilm, StringRenderer } from '../dist/index.js';
import { createFakeResizeSource } from './helpers.js';

test('scene resize handlers can redraw after terminal size changes', async () => {
    const film = defineFilm({ title: 'Resize Story' });
    const renderer = new StringRenderer();
    const resizeSource = createFakeResizeSource({
        columns: 20,
        rows: 5,
        isTTY: true,
        colorDepth: 24,
        unicode: true,
    });

    film.scene('room', async ($) => {
        $.onResize(async ({ previous, current }) => {
            await $.clear();
            $.draw.text(0, 0, `room ${String(previous.columns)}->${String(current.columns)}`);
            await $.cut();
        });

        $.draw.text(0, 0, `start ${String($.terminal.columns)}`);
        await $.cut();

        resizeSource.resize({ columns: 12, rows: 4 });
        await $.beat(20);

        $.draw.text(0, 1, `now ${String($.terminal.columns)}x${String($.terminal.rows)}`);
        await $.cut();
    });

    const result = await runFilm(film, {
        renderer,
        clock: new FakeClock(),
        resizeSource,
        terminal: resizeSource.current(),
    });

    assert.equal(result.terminal.columns, 12);
    assert.equal(result.terminal.rows, 4);
    assert.match(renderer.frames.join('\n'), /room 20->12/);
    assert.match(renderer.lastFrame(), /now 12x4/);
});
