import type { Clock } from '../../dist/index.js';

export class SuspendedClock implements Clock {
    public now(): number {
        return 0;
    }

    public async wait(): Promise<void> {
        await new Promise(() => undefined);
    }
}
