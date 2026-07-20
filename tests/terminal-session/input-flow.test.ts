import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'vitest';
import { InputController } from '../../dist/index.js';
import { TerminalSession, type ReadableTTYLike } from '../../dist/node.js';
import { createFakeInput } from '../helpers.js';

test('terminal session restores a fresh idle input despite isPaused reporting false', () => {
    const input = createFakeInput({ flowing: null });
    const session = new TerminalSession({ input });

    assert.equal(input.readableFlowing, null);
    assert.equal(input.isPaused?.(), false);

    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();

    assert.equal(input.readableFlowing, false);
    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 1);
});

test('terminal session restores an explicitly paused input stream', () => {
    const input = createFakeInput({ flowing: false });
    const session = new TerminalSession({ input });

    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();

    assert.equal(input.readableFlowing, false);
    assert.equal(input.pauseCalls, 1);
});

test('terminal session preserves an input stream that was already flowing', () => {
    const input = createFakeInput({ flowing: true });
    const session = new TerminalSession({ input });

    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();

    assert.equal(input.readableFlowing, true);
    assert.equal(input.resumeCalls, 1);
    assert.equal(input.pauseCalls, 0);
});

test('terminal session restores input flow when raw mode is unavailable', () => {
    const input = createFakeInput({ flowing: null, rawMode: false });
    const session = new TerminalSession({ input });

    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();

    assert.equal(input.readableFlowing, false);
    assert.equal(input.pauseCalls, 1);
    assert.deepEqual(input.rawModes, []);
});

test('terminal session restores real Node stream flow and listeners', () => {
    const input = createRealInput();
    const session = new TerminalSession({ input });

    assert.equal(input.readableFlowing, null);
    assert.equal(input.isPaused(), false);

    session.useRawMode();
    session.bindInput(new InputController());

    assert.equal(input.readableFlowing, true);
    assert.equal(input.listenerCount('data'), 1);

    session.restore();

    assert.equal(input.readableFlowing, false);
    assert.equal(input.listenerCount('data'), 0);
    assert.equal(input.listenerCount('keypress'), 0);
    assert.equal(input.isRaw, false);
    input.destroy();
});

test('terminal session preserves caller-owned stream listeners', () => {
    const input = createRealInput();
    const ownerData = (): void => undefined;
    input.on('data', ownerData);
    const session = new TerminalSession({ input });

    session.useRawMode();
    session.bindInput(new InputController());
    session.restore();

    assert.equal(input.listenerCount('data'), 1);
    assert.equal(input.listeners('data')[0], ownerData);
    assert.equal(input.readableFlowing, true);
    input.off('data', ownerData);
    input.destroy();
});

function createRealInput(): PassThrough & ReadableTTYLike {
    const input = new PassThrough() as PassThrough & ReadableTTYLike;
    input.isTTY = true;
    input.isRaw = false;
    input.setRawMode = (mode) => {
        input.isRaw = mode;
        return input;
    };
    return input;
}
