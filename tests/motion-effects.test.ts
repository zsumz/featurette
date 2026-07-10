import assert from 'node:assert/strict';
import { test } from 'vitest';
import { defineFilm } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('motion effects render deterministic stars, fades, glitches, and shake timing', async () => {
    const film = defineFilm({
        title: 'Motion Effects',
        fps: 24,
        voices: { process: { speed: 0 } },
    });

    film.scene('motion', async ($) => {
        await $.effects.fadeIn(100, () => {
            $.layer('main').text(0, 0, 'fade target');
        });
        await $.effects.fadeOut(50);
        await $.effects.starfield({
            density: 0.12,
            duration: 75,
            seed: 7,
            twinkle: true,
            colors: ['memory'],
        });
        await $.effects.glitch({
            duration: 100,
            intensity: 0.5,
        });
        await $.effects.screenShake({ duration: 25 });
    });

    const result = await renderScene(film, 'motion', {
        terminal: { columns: 24, rows: 8 },
        reducedMotion: false,
    });

    assert.doesNotMatch(result.lastFrame, /fade target/);
    assert.match(result.lastFrame, /[.*+]/);
    assert.equal(result.frames.some((frame) => /[#%]/.test(frame)), true);
    assert.ok(result.elapsed >= 350);
});

test('screen shake offsets rendered frames before restoring the scene', async () => {
    const film = defineFilm({
        title: 'Shake',
        fps: 12,
    });

    film.scene('impact', async ($) => {
        $.layer('main').text(2, 1, 'BOOM');
        await $.cut();
        await $.effects.screenShake({ duration: 200, intensity: 1 });
    });

    const result = await renderScene(film, 'impact', {
        terminal: { columns: 12, rows: 4 },
        reducedMotion: false,
    });

    const restoredFrame = result.lastFrame;
    const shakenFrames = result.frames.filter((frame) => frame.includes('BOOM') && frame !== restoredFrame);

    assert.match(restoredFrame, /\n {2}BOOM/);
    assert.ok(shakenFrames.length > 0);
});
