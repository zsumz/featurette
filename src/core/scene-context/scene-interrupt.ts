import type { InterruptHandler } from '../film.js';
import type { SceneContext } from './types.js';
import { asInterruptControl, SceneControlError } from './control.js';
import type { SceneExecution } from './scene-execution.js';

type InterruptContextFactory = () => SceneContext;

export class SceneInterrupt {
    private handling = false;

    constructor(
        private readonly execution: SceneExecution,
        private readonly handlers: InterruptHandler[],
        private readonly createContext: InterruptContextFactory,
    ) {}

    public async handle(): Promise<void> {
        if (this.handling || !this.execution.suspend()) {
            return;
        }

        this.handling = true;

        try {
            const context = this.createContext();

            for (const handler of this.handlers) {
                await handler(context);
            }

            this.execution.resume();
        } catch (error) {
            const interruption = error instanceof SceneControlError
                ? asInterruptControl(error)
                : error;
            this.execution.interrupt(interruption);
        } finally {
            this.handling = false;
        }
    }
}
