import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderFilm } from '../dist/test.js';

test('film builder can replace scenes', async () => {
    const film = defineFilm({ title: 'Replace Scene' });

    film.scene('same', async ($) => {
        await $.say('process', 'first');
    });

    film.scene('same', async ($) => {
        await $.say('process', 'second');
    });

    const result = await renderFilm(film, {
        terminal: { columns: 20, rows: 5 },
    });

    assert.equal(film.scenes.length, 1);
    assert.match(result.transcript, /second/);
    assert.doesNotMatch(result.transcript, /first/);
});
