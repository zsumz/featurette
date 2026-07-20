import type { InputController } from '../../core/input.js';
import type { TerminalResizeSource } from '../../core/runtime.js';
import type { TerminalInfo } from '../../core/types.js';
import { runCleanupSteps } from '../cleanup.js';
import type {
    ReadableTTYLike,
    TerminalSessionOptions,
    WritableTTYLike,
} from '../session-types.js';
import { TerminalDisplay } from './terminal-display.js';
import { TerminalInput } from './terminal-input.js';

export class TerminalSession {
    public readonly input: ReadableTTYLike;
    public readonly output: WritableTTYLike;
    private readonly display: TerminalDisplay;
    private readonly inputSession: TerminalInput;
    private restored = false;

    constructor(private readonly options: TerminalSessionOptions = {}) {
        this.input = options.input ?? process.stdin;
        this.output = options.output ?? process.stdout;
        this.display = new TerminalDisplay(this.output, options);
        this.inputSession = new TerminalInput(this.input);
    }

    public get info(): TerminalInfo {
        return {
            columns: streamColumns(this.output, 80),
            rows: streamRows(this.output, 24),
            isTTY: this.output.isTTY === true,
            colorDepth: typeof this.output.getColorDepth === 'function' ? this.output.getColorDepth() : 1,
            unicode: process.env.LC_ALL !== 'C',
        };
    }

    public write(chunk: string): void {
        this.display.write(chunk);
    }

    public hideCursor(): void {
        this.assertActive();
        this.display.hideCursor();
    }

    public showCursor(): void {
        this.display.showCursor();
    }

    public enterAltScreen(): void {
        this.assertActive();
        this.display.enterAltScreen();
    }

    public leaveAltScreen(): void {
        this.display.leaveAltScreen();
    }

    public useRawMode(): void {
        this.assertActive();
        this.inputSession.useRawMode();
    }

    public bindInput(controller: InputController, options: { hardExit?: () => void | Promise<void> } = {}): void {
        this.assertActive();
        this.inputSession.bind(controller, {
            ...options,
            exit: (code) => {
                this.exit(code);
            },
        });
    }

    public resizeSource(): TerminalResizeSource {
        return {
            current: () => this.info,
            onResize: (handler) => {
                const signals = this.options.signals ?? process;
                signals.on('SIGWINCH', handler);

                return () => {
                    signals.off('SIGWINCH', handler);
                };
            },
        };
    }

    public restore(): void {
        if (this.restored) {
            return;
        }

        this.restored = true;
        runCleanupSteps([
            () => {
                this.inputSession.restore();
            },
            () => {
                this.display.restore();
            },
        ]);
    }

    private exit(code: number): void {
        const exit = this.options.exit ?? ((exitCode: number) => process.exit(exitCode));
        exit(code);
    }

    private assertActive(): void {
        if (this.restored) {
            throw new Error('TerminalSession has already been restored.');
        }
    }
}

function streamColumns(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.columns === 'number' ? stream.columns : fallback;
}

function streamRows(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.rows === 'number' ? stream.rows : fallback;
}
