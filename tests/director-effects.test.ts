import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('director effects render title cards, countdowns, and scanlines', async () => {
    const film = defineFilm({
        title: 'Director Pack',
        voices: {
            process: { fg: 'process', speed: 10 },
        },
    });

    film.scene('opening', async ($) => {
        await $.effects.titleCard({
            title: 'BUILD NIGHT',
            subtitle: 'a terminal story',
            voice: 'process',
            duration: 100,
        });
        await $.effects.countdown({
            from: 2,
            to: 1,
            finalText: 'ship',
            interval: 100,
            voice: 'process',
        });
        await $.effects.scanlines({
            spacing: 3,
            char: '.',
            duration: 100,
        });
    });

    const result = await renderScene(film, 'opening', {
        terminal: { columns: 40, rows: 12 },
        reducedMotion: false,
    });

    assert.match(result.transcript, /BUILD NIGHT/);
    assert.match(result.transcript, /a terminal story/);
    assert.match(result.transcript, /2/);
    assert.match(result.transcript, /1/);
    assert.match(result.transcript, /ship/);
    assert.match(result.lastFrame, /\.\.\.\./);
    assert.ok(result.elapsed >= 300);
});
