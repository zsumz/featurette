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
