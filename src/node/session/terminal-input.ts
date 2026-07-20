import type { InputController, KeyEvent } from '../../core/input.js';
import { runCleanupSteps } from '../cleanup.js';
import { bindKeypressInput } from '../keypress-binding.js';
import type { KeypressKey, ReadableTTYLike } from '../session-types.js';
import { isInputFlowing } from './input-flow.js';

interface BindInputOptions {
    exit(code: number): void;
    hardExit?: () => void | Promise<void>;
}

export class TerminalInput {
    private restoreRawMode?: boolean;
    private rawModeSetter?: (mode: boolean) => ReadableTTYLike;
    private rawModeEnabled = false;
    private inputWasFlowing?: boolean;
    private restored = false;
    private cleanupHandlers: Array<() => void> = [];

    constructor(public readonly input: ReadableTTYLike) {}

    public useRawMode(): void {
        const setRawMode = this.input.setRawMode?.bind(this.input);

        if (this.input.isTTY !== true || setRawMode === undefined || this.rawModeEnabled) {
            return;
        }

        this.restoreRawMode = this.input.isRaw;
        this.rawModeSetter = setRawMode;
        setRawMode(true);
        this.rawModeEnabled = true;
    }

    public bind(controller: InputController, options: BindInputOptions): void {
        const handler = createKeypressHandler(controller, options);
        this.inputWasFlowing ??= isInputFlowing(this.input);
        this.cleanupHandlers.push(bindKeypressInput(this.input, handler));
        this.input.resume();
    }

    public restore(): void {
        if (this.restored) {
            return;
        }

        this.restored = true;
        const cleanups = this.cleanupHandlers.splice(0);
        runCleanupSteps([
            ...cleanups,
            () => {
                this.restoreRawInput();
            },
            () => {
                this.restoreInputFlow();
            },
        ]);
    }

    private restoreRawInput(): void {
        if (!this.rawModeEnabled) {
            return;
        }

        const setter = this.rawModeSetter;
        const restoreRawMode = this.restoreRawMode === true;
        this.rawModeEnabled = false;
        this.rawModeSetter = undefined;
        this.restoreRawMode = undefined;
        setter?.(restoreRawMode);
    }

    private restoreInputFlow(): void {
        const shouldPause = this.inputWasFlowing === false && isInputFlowing(this.input);
        this.inputWasFlowing = undefined;

        if (shouldPause) {
            this.input.pause?.();
        }
    }
}

function createKeypressHandler(
    controller: InputController,
    options: BindInputOptions,
): (sequence: string, key: KeypressKey) => void {
    let ctrlCCount = 0;

    return (sequence, key) => {
        const event: KeyEvent = {
            name: key.name ?? sequence,
            sequence,
            ctrl: key.ctrl,
            meta: key.meta,
            shift: key.shift,
        };

        if (event.ctrl && event.name === 'c') {
            ctrlCCount += 1;

            if (ctrlCCount > 1) {
                void Promise.resolve()
                    .then(async () => {
                        await options.hardExit?.();
                    })
                    .then(
                        () => {
                            options.exit(130);
                        },
                        () => {
                            options.exit(130);
                        },
                    );
                return;
            }
        } else {
            ctrlCCount = 0;
        }

        void controller.emitKey(event);
    };
}
