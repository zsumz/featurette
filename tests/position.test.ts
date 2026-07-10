import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    center,
    charCellWidth,
    stripAnsi,
    stringCellWidth,
} from '../dist/index.js';

test('point helpers compose terminal-relative offsets', () => {
    const point = center()
        .right(2)
        .left(1)
        .down(2)
        .up(1)
        .shift(3, -1)
        .dxBy(1)
        .dyBy(1)
        .dx(-2)
        .dy(2);

    assert.equal(point.x, 'center');
    assert.equal(point.y, 'middle');
    assert.equal(point.offsetX, 3);
    assert.equal(point.offsetY, 3);
});

test('string cell width ignores ansi escapes and combining marks', () => {
    assert.equal(stripAnsi('\u001B[31mred\u001B[0m'), 'red');
    assert.equal(stringCellWidth('\u001B[31m界e\u0301\u001B[0m'), 3);
    assert.equal(charCellWidth('\u0301'), 0);
    assert.equal(charCellWidth('\0'), 0);
    assert.equal(charCellWidth('界'), 2);
});
