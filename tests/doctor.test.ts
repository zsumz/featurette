import assert from 'node:assert/strict';
import { test } from 'vitest';
import { doctor, formatDoctorReport, inspectTerminal } from '../dist/node.js';
import { createFakeInput, createFakeOutput } from './helpers.js';

test('doctor reports ready and limited terminal capability', () => {
    const readyInput = createFakeInput();
    const readyOutput = createFakeOutput({ isTTY: true, columns: 120, rows: 40, colorDepth: 24 });
    const ready = inspectTerminal({
        input: readyInput,
        output: readyOutput,
        env: { LANG: 'en_US.UTF-8' },
        minSize: { columns: 80, rows: 24 },
    });

    assert.equal(ready.verdict, 'ready');
    assert.equal(ready.trueColor, true);
    assert.equal(ready.rawInput, true);
    assert.match(formatDoctorReport(ready), /You are ready/);

    const limitedOutput = createFakeOutput({ isTTY: false, columns: 40, rows: 10, colorDepth: 1 });
    const limited = doctor({
        input: createFakeInput({ isTTY: false, rawMode: false }),
        output: limitedOutput,
        env: { NO_COLOR: '1', LC_ALL: 'C' },
        minSize: { columns: 80, rows: 24 },
    });

    assert.equal(limited.verdict, 'limited');
    assert.equal(limited.sizeOk, false);
    assert.equal(limited.color, false);
    assert.match(limitedOutput.text(), /Limited mode recommended/);
    assert.match(limitedOutput.text(), /stdout is not a TTY/);
    assert.match(limitedOutput.text(), /terminal is smaller/);
});
