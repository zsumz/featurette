import type { InputController } from './input-controller.js';
import type {
    CtrlCMode,
    InputBindings,
    KeyHandler,
} from './types.js';

export class InputScope implements InputBindings {
    private readonly cleanups: Set<() => void> = new Set();

    constructor(private readonly controller: InputController) {}

    public onKey(name: string, handler: KeyHandler): () => void {
        return this.track(this.controller.onKey(name, handler));
    }

    public onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void {
        return this.track(this.controller.onCtrlC(mode, handler));
    }

    public dispose(): void {
        for (const cleanup of [...this.cleanups]) {
            cleanup();
        }
    }

    private track(cleanup: () => void): () => void {
        let active = true;
        const trackedCleanup = (): void => {
            if (!active) {
                return;
            }

            active = false;
            this.cleanups.delete(trackedCleanup);
            cleanup();
        };

        this.cleanups.add(trackedCleanup);
        return trackedCleanup;
    }
}
