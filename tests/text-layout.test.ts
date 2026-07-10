import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createScreen, defineFilm, stringCellWidth } from '../dist/index.js';
import { renderScene } from '../dist/test.js';

test('grapheme clusters occupy stable terminal cells', () => {
    const glyph = '👩‍💻';
    const screen = createScreen({ columns: 8, rows: 2 });

    screen.layer('main').text(0, 0, `${glyph}X`);

    const cells = screen.compose().cells[0];

    assert.equal(stringCellWidth(glyph), 2);
    assert.equal(cells[0]?.char, glyph);
    assert.equal(cells[1]?.char, ' ');
    assert.equal(cells[2]?.char, 'X');
});

test('type animation advances by grapheme cluster instead of code point', async () => {
    const glyph = '👩‍💻';
    const film = defineFilm({
        title: 'Grapheme Typing',
        voices: { process: { speed: 10, cursor: '_' } },
    });

    film.scene('emoji', async ($) => {
        await $.type(`${glyph}!`, { voice: 'process' });
    });

    const result = await renderScene(film, 'emoji', {
        terminal: { columns: 12, rows: 3 },
        reducedMotion: false,
    });

    assert.equal(result.frames.length, 3);
    assert.ok(result.frames[0]?.includes(`${glyph} _`));
    assert.ok(result.frames[1]?.includes(`${glyph} !_`));
    assert.ok(result.lastFrame.includes(`${glyph} !`));
    assert.equal(result.elapsed, 20);
});

test('backspace clamps the cursor at the left edge', async () => {
    const film = defineFilm({ title: 'Backspace Clamp' });

    film.scene('erase', async ($) => {
        await $.type('abc');
        await $.backspace(10);
        await $.type('x');
    });

    const result = await renderScene(film, 'erase', {
        terminal: { columns: 8, rows: 2 },
        skip: true,
    });

    assert.equal(result.lastFrame, 'x');
});
