import assert from 'node:assert/strict';
import { test } from 'vitest';
import { InputController } from '../../dist/index.js';
import { TerminalSession, withTerminalSession } from '../../dist/node.js';
import { createFakeInput, createFakeOutput } from '../helpers.js';

test('terminal session cleans up partial setup when input resume fails', async () => {
    const input = createFakeInput({ flowing: null });
    input.resume = () => {
        input.resumeCalls += 1;
        throw new Error('resume failed');
    };

    await assert.rejects(
        withTerminalSession((session) => {
            session.useRawMode();
            session.bindInput(new InputController());
        }, { input }),
        /resume failed/,
    );

    assert.deepEqual(input.rawModes, [true, false]);
    assert.equal(input.listenerCount('data'), 0);
    assert.equal(input.listenerCount('keypress'), 0);
});

test('terminal session attempts every cleanup step after a restoration failure', () => {
    const input = createFailingRawInput('raw restore failed');
    const output = createFakeOutput({ isTTY: true });
    const session = new TerminalSession({ input, output });

    session.enterAltScreen();
    session.hideCursor();
    session.useRawMode();
    session.bindInput(new InputController());

    assert.throws(() => {
        session.restore();
    }, /raw restore failed/);
    assert.equal(input.listenerCount('data'), 0);
    assert.equal(input.pauseCalls, 1);
    assert.equal(output.text().includes('\x1b[?25h'), true);
    assert.equal(output.text().includes('\x1b[?1049l'), true);
    assert.equal(output.text().endsWith('\x1b[0m'), true);
});

test('withTerminalSession preserves playback and cleanup failures', async () => {
    const input = createFailingRawInput('cleanup failed');

    await assert.rejects(
        withTerminalSession((session) => {
            session.useRawMode();
            throw new Error('playback failed');
        }, { input }),
        (error: unknown) => {
            assert.equal(error instanceof AggregateError, true);

            if (!(error instanceof AggregateError)) {
                return false;
            }

            const failures: unknown[] = error.errors;
            assert.deepEqual(
                failures.map((failure) => failure instanceof Error ? failure.message : failure),
                ['playback failed', 'cleanup failed'],
            );
            return true;
        },
    );
});

function createFailingRawInput(message: string): ReturnType<typeof createFakeInput> {
    const input = createFakeInput();
    input.setRawMode = (mode) => {
        input.rawModes.push(mode);
        input.isRaw = mode;

        if (!mode) {
            throw new Error(message);
        }

        return input;
    };
    return input;
}
