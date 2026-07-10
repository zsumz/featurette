import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    runFilm,
    sprite,
    stringCellWidth,
    StringRenderer,
} from '../dist/index.js';
import { renderAt, renderFilm, renderScene } from '../dist/test.js';

test('renders a scene with timed dialogue and transcript entries', async () => {
    const film = defineFilm({
        title: 'Test Film',
        fps: 24,
        palette: {
            process: '#6EE7F9',
            system: '#8A8F98',
        },
        voices: {
            process: { fg: 'process', speed: 1, cursor: '|' },
            system: { fg: 'system', speed: 0 },
        },
    });

    film.scene('wake', async ($) => {
        await $.clear();
        await $.type('hello?', { at: $.center().dy(-1), voice: 'process', speed: 1 });
        await $.beat(100);
        await $.say('system', 'pid: 43891');
    });

    const result = await renderScene(film, 'wake', {
        terminal: { columns: 40, rows: 10 },
        reducedMotion: false,
    });

    assert.match(result.lastFrame, /hello\?/);
    assert.match(result.lastFrame, /pid: 43891/);
    assert.match(result.transcript, /hello\?/);
    assert.match(result.transcript, /pid: 43891/);
    assert.deepEqual(result.result.scenesPlayed, ['wake']);
    assert.ok(result.elapsed >= 100);
});

test('composes layers in z-index order', async () => {
    const film = defineFilm({ title: 'Layers' });

    film.scene('stack', async ($) => {
        $.layer('back', { zIndex: 0 }).text(1, 1, 'back');
        $.layer('front', { zIndex: 10 }).text(1, 1, 'front');
        await $.cut();
    });

    const result = await renderScene(film, 'stack', {
        terminal: { columns: 16, rows: 4 },
    });

    assert.match(result.lastFrame, /front/);
    assert.doesNotMatch(result.lastFrame, /back/);
});

test('supports sprites and cell-width-aware layout', async () => {
    const ship = sprite`
    /\
   /__\
  `;

    const film = defineFilm({ title: 'Sprites' });

    film.scene('ship', async ($) => {
        await $.clear();
        $.draw.sprite(ship, $.center(), { fg: 'cyan' });
        await $.type('界', { at: { x: 'center', y: 'bottom' }, speed: 0 });
    });

    const result = await renderScene(film, 'ship', {
        terminal: { columns: 12, rows: 6 },
    });

    assert.equal(stringCellWidth('界'), 2);
    assert.match(result.lastFrame, /\/\\/);
    assert.match(result.lastFrame, /界/);
});

test('renderAt returns the closest captured frame', async () => {
    const film = defineFilm({ title: 'Frame Time', voices: { process: { speed: 10 } } });

    film.scene('time', async ($) => {
        await $.type('abc', { voice: 'process' });
        await $.beat(50);
        await $.type('done', { at: { x: 0, y: 2 }, speed: 0 });
    });

    const frame = await renderAt(film, {
        scene: 'time',
        time: 20,
        terminal: { columns: 16, rows: 5 },
        reducedMotion: false,
    });

    assert.match(frame.toString(), /ab/);
});

test('runFilm can target a custom renderer', async () => {
    const film = defineFilm({ title: 'Custom Renderer' });
    const renderer = new StringRenderer();

    film.scene('one', async ($) => {
        await $.say('process', 'custom');
    });

    await runFilm(film, {
        renderer,
        terminal: { columns: 20, rows: 5 },
        skip: true,
    });

    assert.match(renderer.lastFrame(), /custom/);
    assert.match(renderer.transcriptText(), /custom/);
});

test('renderFilm runs all scenes in order', async () => {
    const film = defineFilm({ title: 'All Scenes' });

    film.scene('one', async ($) => {
        await $.say('process', 'one');
    });

    film.scene('two', async ($) => {
        await $.say('process', 'two');
    });

    const result = await renderFilm(film, {
        terminal: { columns: 20, rows: 5 },
    });

    assert.deepEqual(result.result.scenesPlayed, ['one', 'two']);
    assert.match(result.transcript, /one/);
    assert.match(result.transcript, /two/);
});
