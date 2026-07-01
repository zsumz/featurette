import type { Clock } from './types.js';

export class RealClock implements Clock {
    private readonly startedAt = Date.now();

    public now(): number {
        return Date.now() - this.startedAt;
    }

    public async wait(ms: number): Promise<void> {
        const delay = Math.max(0, Math.round(ms));

        if (delay === 0) {
            return;
        }

        await new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }
}
