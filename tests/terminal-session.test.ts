import assert from 'node:assert/strict';
import { test } from 'vitest';
import { InputController } from '../dist/index.js';
import { TerminalSession } from '../dist/node.js';
import { createFakeInput, createFakeOutput, flushPromises } from './helpers.js';

test('terminal session restores cursor, alt screen, raw mode, and listeners', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true });
    const controller = new InputController();
    const session = new TerminalSession({ input, output });
    const seen: string[] = [];

    controller.onKey('q', () => {
        seen.push('q');
    });

    session.enterAltScreen();
    session.hideCursor();
    session.useRawMode();
    session.bindInput(controller);
    input.emit('keypress', 'q', { name: 'q' });
    await flushPromises();
    session.restore();

    assert.deepEqual(input.rawModes, [true, false]);
    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 1);
    assert.deepEqual(seen, ['q']);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(output.text().includes('\x1b[?1049h'), true);
    assert.equal(output.text().includes('\x1b[?1049l'), true);
    assert.equal(output.text().includes('\x1b[?25l'), true);
    assert.equal(output.text().includes('\x1b[?25h'), true);
    assert.equal(output.text().includes('\x1b[0m'), true);
});

test('terminal session preserves an input stream that was already flowing', () => {
    const input = createFakeInput({ paused: false });
    const session = new TerminalSession({ input });

    session.useRawMode();
    session.restore();

    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 0);
});

test('terminal session hard-exits through an injectable exit hook on second ctrl-c', async () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true });
    const exits: number[] = [];
    const hardExits: string[] = [];
    const controller = new InputController();
    const session = new TerminalSession({
        input,
        output,
        exit: (code) => {
            exits.push(code);
        },
    });

    session.bindInput(controller, {
        hardExit: () => {
            hardExits.push('restore');
            session.restore();
        },
    });

    input.emit('keypress', '\u0003', { name: 'c', ctrl: true });
    input.emit('keypress', '\u0003', { name: 'c', ctrl: true });
    await flushPromises();

    assert.deepEqual(hardExits, ['restore']);
    assert.deepEqual(exits, [130]);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(output.text().includes('\x1b[0m'), true);
});
