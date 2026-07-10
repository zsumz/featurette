import assert from 'node:assert/strict';
import { test } from 'vitest';
import { FakeClock, RealClock } from '../dist/index.js';

test('FakeClock advances deterministically without sleeping', async () => {
    const clock = new FakeClock();

    await clock.wait(10.6);
    await clock.wait(-100);

    assert.equal(clock.now(), 11);
});

test('RealClock measures elapsed wall time', async () => {
    const clock = new RealClock();
    const before = clock.now();

    await clock.wait(5);

    assert.ok(clock.now() - before >= 1);
});
