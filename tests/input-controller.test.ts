import assert from 'node:assert/strict';
import { test } from 'vitest';
import { InputController } from '../dist/index.js';

test('input controller supports key removal and ctrl-c handling', async () => {
    const controller = new InputController();
    const seen: string[] = [];
    const offKey = controller.onKey('space', (event) => {
        seen.push(event.name);
    });
    const offCtrlC = controller.onCtrlC('soft', () => {
        seen.push('ctrl-c');
    });

    await controller.emitKey({ name: 'space' });
    offKey();
    await controller.emitKey({ name: 'space' });
    assert.equal(await controller.emitCtrlC(), true);
    offCtrlC();
    assert.equal(await controller.emitCtrlC(), false);
    assert.deepEqual(seen, ['space', 'ctrl-c']);
});

test('input controller removes only the requested registration', async () => {
    const controller = new InputController();
    const seen: string[] = [];

    controller.onKey('space', () => {
        seen.push('owner');
    });
    const offScoped = controller.onKey('space', () => {
        seen.push('scope');
    });

    await controller.emitKey({ name: 'space' });
    offScoped();
    await controller.emitKey({ name: 'space' });

    assert.deepEqual(seen, ['owner', 'scope', 'owner']);
});

test('input controller preserves identical handlers registered separately', async () => {
    const controller = new InputController();
    let calls = 0;
    const sharedHandler = (): void => {
        calls += 1;
    };

    controller.onKey('space', sharedHandler);
    controller.onCtrlC('soft', sharedHandler);
    const offKey = controller.onKey('space', sharedHandler);
    const offCtrlC = controller.onCtrlC('soft', sharedHandler);
    offKey();
    offCtrlC();

    await controller.emitKey({ name: 'space' });
    await controller.emitCtrlC();

    assert.equal(calls, 2);
});
