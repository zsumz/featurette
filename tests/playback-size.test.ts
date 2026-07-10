import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm, TerminalTooSmallError } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('too-small films can fall back to transcript mode', async () => {
    const film = defineFilm({
        title: 'Small Terminal',
        minSize: { columns: 80, rows: 24 },
        tooSmall: 'transcript',
        voices: { process: { speed: 10 } },
    });

    film.scene('tiny', async ($) => {
        await $.say('process', 'small but still readable');
        await $.beat(500);
    });

    const result = await renderScene(film, 'tiny', {
        terminal: { columns: 20, rows: 5 },
        reducedMotion: false,
    });

    assert.equal(result.result.mode, 'transcript');
    assert.equal(result.result.tooSmall, true);
    assert.equal(result.result.fallbackReason, 'too-small');
    assert.match(result.transcript, /small but still readable/);
    assert.equal(result.elapsed, 0);
});

test('too-small films ask for resize by default', async () => {
    const film = defineFilm({
        title: 'Resize Please',
        minSize: { columns: 80, rows: 24 },
    });

    film.scene('tiny', async ($) => {
        await $.say('process', 'you should not see this');
    });

    await assert.rejects(
        async () =>
            renderScene(film, 'tiny', {
                terminal: { columns: 20, rows: 5 },
            }),
        TerminalTooSmallError,
    );
});
