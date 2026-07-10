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

test('motion timelines drive keyframes, tweens, and path movement', async () => {
    const film = defineFilm({
        title: 'Motion Primitives',
        fps: 10,
    });

    film.scene('travel', async ($) => {
        await $.effects.keyframes({
            duration: 100,
            frames: 3,
            layer: 'counter',
            draw: ({ frame, layer }) => {
                layer?.text(frame, 0, String(frame));
            },
        });

        await $.effects.tween({
            from: { x: 0, y: 1 },
            to: { x: 5, y: 1 },
            duration: 100,
            frames: 3,
            layer: 'dot',
            draw: ({ point, layer }) => {
                layer?.text(point.x, point.y, 'o');
            },
        });

        await $.effects.moveAlong({
            path: [
                { x: 0, y: 2 },
                { x: 5, y: 2 },
                { x: 5, y: 4 },
            ],
            duration: 120,
            frames: 5,
            layer: 'packet',
            draw: ({ point, segment, layer }) => {
                layer?.text(point.x, point.y, segment === 0 ? '>' : 'v');
            },
        });
    });

    const result = await renderScene(film, 'travel', {
        terminal: { columns: 12, rows: 6 },
        reducedMotion: false,
    });

    assert.match(result.lastFrame, /^ {2}2/m);
    assert.match(result.lastFrame, /^ {5}o/m);
    assert.match(result.lastFrame, /^ {5}v/m);
    assert.equal(result.frames.some((frame) => /^ {3}o/m.test(frame)), true);
    assert.ok(result.elapsed >= 319);
});

test('motion primitives resolve anchored points and reduced motion to the final frame', async () => {
    const film = defineFilm({
        title: 'Anchored Motion',
        fps: 24,
    });

    film.scene('anchor', async ($) => {
        await $.effects.tween({
            from: { x: 'left', y: 'middle' },
            to: { x: 'right', y: 'middle' },
            subject: { columns: 2, rows: 1 },
            duration: 400,
            layer: 'ship',
            draw: ({ point, progress, layer }) => {
                layer?.text(point.x, point.y, progress === 1 ? '[]' : '..');
            },
        });
    });

    const result = await renderScene(film, 'anchor', {
        terminal: { columns: 10, rows: 5 },
        reducedMotion: true,
    });

    assert.match(result.lastFrame, /^ {8}\[\]/m);
    assert.equal(result.elapsed, 0);
});
