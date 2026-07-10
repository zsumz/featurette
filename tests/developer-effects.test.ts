import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('developer metaphor effects render tests and conflicts', async () => {
    const film = defineFilm({
        title: 'Developer Cinema',
        voices: {
            system: { fg: 'system', speed: 0 },
        },
    });

    film.scene('ci', async ($) => {
        await $.effects.testRunner({
            title: 'Featurette CI',
            voice: 'system',
            lines: [
                { name: 'types compile', status: 'pass' },
                { name: 'terminal restores', status: 'pass' },
                { name: 'feelings snapshot', status: 'fail', detail: 'too much silence' },
                { name: 'gif export', status: 'skip' },
            ],
        });

        await $.effects.mergeConflict({
            at: { x: 0, y: 7 },
            voice: 'system',
            oursLabel: 'memory',
            theirsLabel: 'process',
            ours: ['i was useful.'],
            theirs: ['i was alive.'],
            resolved: ['i was here.'],
        });
    });

    const result = await renderScene(film, 'ci', {
        terminal: { columns: 60, rows: 16 },
    });

    assert.match(result.transcript, /Featurette CI/);
    assert.match(result.transcript, /ok types compile/);
    assert.match(result.transcript, /not ok feelings snapshot - too much silence/);
    assert.match(result.transcript, /2 passed, 1 failed, 1 skipped/);
    assert.match(result.transcript, /<<<<<<< memory/);
    assert.match(result.transcript, />>>>>>> process/);
    assert.match(result.transcript, /i was here\./);
    assert.match(result.lastFrame, /i was here\./);
});

test('developer utility effects render log streams and progress bars', async () => {
    const film = defineFilm({
        title: 'Developer Utilities',
        voices: {
            system: { fg: 'system', speed: 0 },
        },
    });

    film.scene('ops', async ($) => {
        await $.effects.logStream({
            at: { x: 0, y: 0 },
            voice: 'system',
            interval: 50,
            lines: ['booting worker', 'warming cache'],
        });

        await $.effects.progress({
            at: { x: 0, y: 3 },
            voice: 'system',
            label: 'load',
            width: 6,
            duration: 100,
            failAtEnd: true,
        });
    });

    const result = await renderScene(film, 'ops', {
        terminal: { columns: 36, rows: 8 },
        reducedMotion: false,
    });

    assert.match(result.lastFrame, /booting worker/);
    assert.match(result.lastFrame, /warming cache/);
    assert.match(result.lastFrame, /load \[!!!!!!\]/);
    assert.match(result.transcript, /booting worker/);
    assert.match(result.transcript, /warming cache/);
    assert.match(result.transcript, /load/);
    assert.ok(result.elapsed >= 200);
});
