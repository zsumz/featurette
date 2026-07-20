import assert from 'node:assert/strict';
import { test } from 'vitest';
import { InputController } from '../../dist/index.js';
import { TerminalSession } from '../../dist/node.js';
import { createFakeInput, createFakeOutput, flushPromises } from '../helpers.js';

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
    input.emit('data', 'q');
    await flushPromises();
    session.restore();

    assert.deepEqual(input.rawModes, [true, false]);
    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 1);
    assert.deepEqual(seen, ['q']);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(input.listenerCount('data'), 0);
    assert.equal(output.text().includes('\x1b[?1049h'), true);
    assert.equal(output.text().includes('\x1b[?1049l'), true);
    assert.equal(output.text().includes('\x1b[?25l'), true);
    assert.equal(output.text().includes('\x1b[?25h'), true);
    assert.equal(output.text().includes('\x1b[0m'), true);
});

test('terminal session restore is idempotent', () => {
    const input = createFakeInput();
    const output = createFakeOutput({ isTTY: true });
    const session = new TerminalSession({ input, output });

    session.enterAltScreen();
    session.hideCursor();
    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();
    const restoredOutput = output.text();

    session.restore();

    assert.equal(output.text(), restoredOutput);
    assert.deepEqual(input.rawModes, [true, false]);
    assert.equal(input.pauseCalls, 1);
});

test('terminal session cannot reacquire owned state after restoration', () => {
    const session = new TerminalSession({
        input: createFakeInput(),
        output: createFakeOutput({ isTTY: true }),
    });

    session.restore();

    assert.throws(() => {
        session.hideCursor();
    }, /already been restored/);
    assert.throws(() => {
        session.enterAltScreen();
    }, /already been restored/);
    assert.throws(() => {
        session.useRawMode();
    }, /already been restored/);
    assert.throws(
        () => {
            session.bindInput(new InputController());
        },
        /already been restored/,
    );
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

    input.emit('data', '\u0003');
    input.emit('data', '\u0003');
    await flushPromises();

    assert.deepEqual(hardExits, ['restore']);
    assert.deepEqual(exits, [130]);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(output.text().includes('\x1b[0m'), true);
});

test('terminal session hard-exits when terminal restoration rejects', async () => {
    const input = createFakeInput();
    const exits: number[] = [];
    const session = new TerminalSession({
        input,
        exit: (code) => {
            exits.push(code);
        },
    });

    session.bindInput(new InputController(), {
        hardExit: async () => {
            await Promise.reject(new Error('restore failed'));
        },
    });

    input.emit('data', '\u0003');
    input.emit('data', '\u0003');
    await flushPromises();

    assert.deepEqual(exits, [130]);
});
