import type { Clock } from './types.js';

export class FakeClock implements Clock {
    private elapsed = 0;

    public now(): number {
        return this.elapsed;
    }

    public async wait(ms: number): Promise<void> {
        this.elapsed += Math.max(0, Math.round(ms));
        await Promise.resolve();
    }
}
