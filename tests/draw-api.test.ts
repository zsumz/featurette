import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('draw primitives cover boxes, lines, logs, diffs, trees, and progress', async () => {
    const film = defineFilm({ title: 'Drawing' });

    film.scene('draw', async ($) => {
        await $.clear();
        $.draw.box(0, 0, 12, 4, { title: 'box' });
        $.draw.line(14, 0, 20, 0);
        $.draw.logs(0, 5, ['log one', 'log two']);
        $.draw.diff(14, 2, '+added\n-removed');
        $.draw.tree(30, 2, ['root', 'leaf']);
        $.draw.progressBar(0, 8, 10, 0.5, { label: 'load' });
        await $.cut();
    });

    const result = await renderScene(film, 'draw', {
        terminal: { columns: 48, rows: 12 },
    });

    assert.match(result.lastFrame, /\+- box ----\+/);
    assert.match(result.lastFrame, /------/);
    assert.match(result.lastFrame, /log one/);
    assert.match(result.lastFrame, /\+added/);
    assert.match(result.lastFrame, /-removed/);
    assert.match(result.lastFrame, /\|- root/);
    assert.match(result.lastFrame, /load \[#####-----\]/);
});
