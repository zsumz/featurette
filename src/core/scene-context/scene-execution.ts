export class SceneExecution {
    private control: unknown;
    private controlRequested = false;
    private readonly interrupted: Promise<unknown>;
    private resolveInterrupt?: (error: unknown) => void;

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

    public interrupt(error: unknown): void {
        if (this.controlRequested) {
            return;
        }

        this.controlRequested = true;
        this.control = error;
        this.resolveInterrupt?.(error);
        this.resolveInterrupt = undefined;
    }

    public async run<T>(operation: () => T | Promise<T>): Promise<T> {
        this.checkpoint();

        return Promise.race([
            Promise.resolve().then(operation),
            this.interrupted.then((error) => {
                throw error;
            }),
        ]);
    }
}
