import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderFilm } from '../dist/test.js';

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
