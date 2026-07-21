export class SceneExecution {
    private control: unknown;
    private controlRequested = false;
    private readonly interrupted: Promise<unknown>;
    private resumeSuspension?: () => void;
    private resolveInterrupt?: (error: unknown) => void;
    private suspension?: Promise<void>;

    constructor() {
        this.interrupted = new Promise((resolve) => {
            this.resolveInterrupt = resolve;
        });
    }

    public checkpoint(): void {
        if (this.controlRequested) {
            throw this.control;
        }
    }

    public suspend(): boolean {
        if (this.controlRequested || this.suspension) {
            return false;
        }

        this.suspension = new Promise((resolve) => {
            this.resumeSuspension = resolve;
        });

        return true;
    }

    public resume(): void {
        this.suspension = undefined;
        this.resumeSuspension?.();
        this.resumeSuspension = undefined;
    }

    public interrupt(error: unknown): void {
        if (this.controlRequested) {
            return;
        }

        this.controlRequested = true;
        this.control = error;
        this.resolveInterrupt?.(error);
        this.resolveInterrupt = undefined;
        this.resume();
    }

    public async run<T>(operation: () => T | Promise<T>): Promise<T> {
        if (this.suspension) {
            await this.waitUntilResumed();
        }

        this.checkpoint();
        const pending = operation();

        const result = await Promise.race([
            Promise.resolve(pending),
            this.interrupted.then((error) => {
                throw error;
            }),
        ]);

        await this.waitUntilResumed();
        this.checkpoint();

        return result;
    }

    private async waitUntilResumed(): Promise<void> {
        while (this.suspension) {
            await Promise.race([
                this.suspension,
                this.interrupted.then((error) => {
                    throw error;
                }),
            ]);
        }
    }
}
