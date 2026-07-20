import assert from 'node:assert/strict';
import { test } from 'vitest';
import { resolveTerminalInfo } from '../src/core/runtime/terminal-info.ts';

test('resolveTerminalInfo reads terminal facts from an injected output source', () => {
    const info = resolveTerminalInfo(undefined, {}, {
        output: {
            columns: 44,
            rows: 12,
            isTTY: true,
            getColorDepth: () => 256,
        },
        env: { LC_ALL: 'en_US.UTF-8' },
    });

    assert.deepEqual(info, {
        columns: 44,
        rows: 12,
        isTTY: true,
        colorDepth: 256,
        unicode: true,
    });
});

test('resolveTerminalInfo prefers explicit terminal overrides over source facts', () => {
    const info = resolveTerminalInfo(
        { columns: 100, rows: 40 },
        {
            columns: 72,
            colorDepth: 8,
            unicode: false,
        },
        {
            output: {
                columns: 44,
                rows: 12,
                isTTY: true,
                getColorDepth: () => 256,
            },
            env: { LC_ALL: 'en_US.UTF-8' },
        },
    );

    assert.deepEqual(info, {
        columns: 72,
        rows: 40,
        isTTY: true,
        colorDepth: 8,
        unicode: false,
    });
});

test('resolveTerminalInfo falls back to default size and ascii mode for bare streams', () => {
    const info = resolveTerminalInfo(undefined, {}, {
        output: {},
        env: { LC_ALL: 'C' },
    });

    assert.deepEqual(info, {
        columns: 80,
        rows: 24,
        isTTY: false,
        colorDepth: 1,
        unicode: false,
    });
});
