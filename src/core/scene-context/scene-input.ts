import type {
    CtrlCMode,
    InputBindings,
    KeyHandler,
} from '../input.js';
import { asInterruptControl, SceneControlError } from './control.js';
import type { InputAPI } from './input-types.js';

type ControlOrigin = 'input' | 'interrupt';

export class SceneInput implements InputAPI {
    constructor(
        private readonly bindings: InputBindings,
        private readonly interrupt: (error: unknown) => void,
    ) {}

    public onKey(name: string, handler: KeyHandler): () => void {
        return this.bindings.onKey(name, this.interruptOnFailure(handler));
    }

    public onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void {
        if (typeof mode === 'function') {
            return this.bindings.onCtrlC(
                this.interruptOnFailure(mode, 'interrupt'),
            );
        }

        if (!handler) {
            throw new Error('onCtrlC() requires a handler.');
        }

        return this.bindings.onCtrlC(
            mode,
            this.interruptOnFailure(handler, 'interrupt'),
        );
    }

    private interruptOnFailure(
        handler: KeyHandler,
        controlOrigin: ControlOrigin = 'input',
    ): KeyHandler {
        return async (event) => {
            try {
                await handler(event);
            } catch (error) {
                const fromInterrupt = controlOrigin === 'interrupt' ||
                    event.ctrl === true && event.name.toLowerCase() === 'c';
                const interruption = fromInterrupt && error instanceof SceneControlError
                    ? asInterruptControl(error)
                    : error;
                this.interrupt(interruption);
            }
        };
    }
}
