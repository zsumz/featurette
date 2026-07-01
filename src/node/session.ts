import type { EventEmitter } from 'node:events';
import readline from 'node:readline';
import type { InputController, KeyEvent } from '../core/input.js';
import type { TerminalInfo } from '../core/types.js';
import type { WritableLike } from '../renderers/terminal.js';

type KeypressKey = Omit<KeyEvent, 'name'> & { name?: string };
type KeypressHandler = (sequence: string, key: KeypressKey) => void;

export interface ReadableTTYLike extends EventEmitter {
    isTTY?: boolean;
    isRaw?: boolean;
    resume(): unknown;
    setRawMode?: (mode: boolean) => ReadableTTYLike;
    on(event: 'keypress', listener: KeypressHandler): this;
    off(event: 'keypress', listener: KeypressHandler): this;
}

export interface WritableTTYLike extends WritableLike {
    columns?: number;
    rows?: number;
    isTTY?: boolean;
    getColorDepth?: () => number;
}

export interface TerminalSessionOptions {
    input?: ReadableTTYLike;
    output?: WritableTTYLike;
    exit?: (code: number) => void;
    useAltScreen?: boolean;
}

export class TerminalSession {
    public readonly input: ReadableTTYLike;
    public readonly output: WritableTTYLike;
    private restoreRawMode?: boolean;
    private rawModeSetter?: (mode: boolean) => ReadableTTYLike;
    private rawModeEnabled = false;
    private cursorHidden = false;
    private altScreen = false;
    private cleanupHandlers: Array<() => void> = [];

    constructor(private readonly options: TerminalSessionOptions = {}) {
        this.input = options.input ?? process.stdin;
        this.output = options.output ?? process.stdout;
    }

    public get info(): TerminalInfo {
        return {
            columns: streamColumns(this.output, 80),
            rows: streamRows(this.output, 24),
            isTTY: this.output.isTTY === true,
            colorDepth:
        typeof this.output.getColorDepth === 'function' ? this.output.getColorDepth() : 1,
            unicode: process.env.LC_ALL !== 'C',
        };
    }

    public write(chunk: string): void {
        this.output.write(chunk);
    }

    public hideCursor(): void {
        if (!this.cursorHidden) {
            this.write('\x1b[?25l');
            this.cursorHidden = true;
        }
    }

    public showCursor(): void {
        if (this.cursorHidden) {
            this.write('\x1b[?25h');
            this.cursorHidden = false;
        }
    }

    public enterAltScreen(): void {
        if (!this.altScreen && (this.options.useAltScreen ?? true)) {
            this.write('\x1b[?1049h');
            this.altScreen = true;
        }
    }

    public leaveAltScreen(): void {
        if (this.altScreen) {
            this.write('\x1b[?1049l');
            this.altScreen = false;
        }
    }

    public useRawMode(): void {
        const setRawMode = this.input.setRawMode?.bind(this.input);

        if (this.input.isTTY !== true || setRawMode === undefined || this.rawModeEnabled) {
            return;
        }

        this.restoreRawMode = this.input.isRaw;
        this.rawModeSetter = setRawMode;
        setRawMode(true);
        this.input.resume();
        this.rawModeEnabled = true;
    }

    public bindInput(controller: InputController, options: { hardExit?: () => void | Promise<void> } = {}): void {
        readline.emitKeypressEvents(this.input as unknown as NodeJS.ReadStream);

        let ctrlCCount = 0;
        const handler = (sequence: string, key: KeypressKey): void => {
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
                    void Promise.resolve(options.hardExit?.()).then(() => {
                        this.exit(130);
                    });
                    return;
                }
            } else {
                ctrlCCount = 0;
            }

            void controller.emitKey(event);
        };

        this.input.on('keypress', handler);
        this.cleanupHandlers.push(() => this.input.off('keypress', handler));
    }

    public restore(): void {
        for (const cleanup of this.cleanupHandlers.splice(0)) {
            cleanup();
        }

        if (this.rawModeEnabled) {
            this.rawModeSetter?.(this.restoreRawMode === true);
            this.rawModeEnabled = false;
            this.rawModeSetter = undefined;
        }

        this.showCursor();
        this.leaveAltScreen();
        this.write('\x1b[0m');
    }

    private exit(code: number): void {
        const exit = this.options.exit ?? ((exitCode: number) => process.exit(exitCode));
        exit(code);
    }
}

export async function withTerminalSession<T>(
    callback: (session: TerminalSession) => Promise<T> | T,
    options: TerminalSessionOptions = {},
): Promise<T> {
    const session = new TerminalSession(options);

    try {
        return await callback(session);
    } finally {
        session.restore();
    }
}

function streamColumns(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.columns === 'number' ? stream.columns : fallback;
}

function streamRows(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.rows === 'number' ? stream.rows : fallback;
}
