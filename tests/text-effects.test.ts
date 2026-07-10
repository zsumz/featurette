import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('text effects cover reveal, redact, replace, backspace, glitch text, and wipe', async () => {
    const film = defineFilm({
        title: 'Text Effects',
        voices: { process: { fg: 'process', speed: 0 } },
    });

    film.scene('text', async ($) => {
        await $.reveal('fade in', { mode: 'fade', at: { x: 0, y: 0 }, voice: 'process' });
        await $.redact('secret words', { at: { x: 0, y: 1 }, voice: 'process' });
        await $.replace('old', 'new', { at: { x: 0, y: 2 }, voice: 'process' });
        await $.type('erase', { at: { x: 0, y: 3 }, voice: 'process', transcript: false });
        await $.backspace(2, { at: { x: 5, y: 3 }, voice: 'process' });
        await $.glitchText('stable', {
            at: { x: 0, y: 4 },
            voice: 'process',
            duration: 100,
            intensity: 1,
        });
        await $.effects.wipe('wipe clean', {
            at: { x: 0, y: 5 },
            voice: 'process',
            speed: 0,
        });
    });

    const result = await renderScene(film, 'text', {
        terminal: { columns: 28, rows: 8 },
        reducedMotion: false,
    });

    assert.match(result.lastFrame, /fade in/);
    assert.match(result.lastFrame, /###### #####/);
    assert.match(result.lastFrame, /new/);
    assert.match(result.lastFrame, /stable/);
    assert.match(result.lastFrame, /wipe clean/);
    assert.match(result.transcript, /secret words/);
    assert.match(result.transcript, /stable/);
    assert.match(result.transcript, /wipe clean/);
});
