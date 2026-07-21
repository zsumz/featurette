import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createScreen, frameToString, TerminalRenderer } from '../dist/index.js';
import { createFakeOutput } from './helpers.js';

test('frame strings retain blank rows', () => {
    const screen = createScreen({ columns: 8, rows: 3 });
    screen.layer('main').text(0, 0, 'title');

    assert.equal(frameToString(screen.compose()), 'title\n\n');
});

test('terminal renderer erases every row before repainting a smaller frame', () => {
    const screen = createScreen({ columns: 8, rows: 3 });
    const output = createFakeOutput({ isTTY: true });
    const renderer = new TerminalRenderer({ output, clearOnBegin: false });

    screen.layer('main').text(0, 0, 'wide');
    screen.layer('main').text(0, 1, 'stale');
    renderer.render(screen.compose());

    screen.clear();
    screen.layer('main').text(0, 0, 'new');
    renderer.render(screen.compose());

    const secondFrame = output.text().split('\x1b[H')[2];
    assert.equal(secondFrame, '\x1b[2Knew\r\n\x1b[2K\r\n\x1b[2K\x1b[0m');
});

test('screen and terminal renderers cover ANSI styling and ASCII fallback', () => {
    const screen = createScreen({ columns: 12, rows: 3 });
    const output = createFakeOutput({ isTTY: true });
    const renderer = new TerminalRenderer({ output, clearOnEnd: true });

    screen.layer('main').text(0, 0, 'hot', { fg: 'panic', bold: true });
    screen.layer('main').text(0, 1, '界', { fg: '#00ff00' });

    const frame = screen.compose(42);
    const colored = frameToString(frame, {
        color: true,
        palette: { panic: '#ff0055' },
    });
    const ascii = frameToString(frame, { unicode: false });

    renderer.begin();
    renderer.render(frame, {
        color: true,
        palette: { panic: '#ff0055' },
    });
    renderer.transcript({ elapsed: 42, text: 'ignored unless overlay' });
    renderer.end();

    assert.equal(colored.includes('\x1b[0m\x1b[1;38;2;255;0;85mhot'), true);
    assert.match(ascii, /\?/);
    assert.equal(output.text().includes('\x1b[2J\x1b[H'), true);
    assert.equal(output.text().includes('\x1b[H'), true);
    assert.equal(output.text().endsWith('\x1b[2J\x1b[H'), true);
});
