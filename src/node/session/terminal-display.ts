import { runCleanupSteps } from '../cleanup.js';
import type { TerminalSessionOptions, WritableTTYLike } from '../session-types.js';

type DisplayOptions = Pick<TerminalSessionOptions, 'ansi' | 'useAltScreen'>;

export class TerminalDisplay {
    private cursorHidden = false;
    private altScreen = false;
    private restored = false;

    constructor(
        public readonly output: WritableTTYLike,
        private readonly options: DisplayOptions,
    ) {}

    public write(chunk: string): void {
        this.output.write(chunk);
    }

    public hideCursor(): void {
        if (this.ansi && !this.cursorHidden) {
            this.cursorHidden = true;
            this.write('\x1b[?25l');
        }
    }

    public showCursor(): void {
        if (this.ansi && this.cursorHidden) {
            this.cursorHidden = false;
            this.write('\x1b[?25h');
        }
    }

    public enterAltScreen(): void {
        if (this.ansi && !this.altScreen && (this.options.useAltScreen ?? true)) {
            this.altScreen = true;
            this.write('\x1b[?1049h');
        }
    }

    public leaveAltScreen(): void {
        if (this.ansi && this.altScreen) {
            this.altScreen = false;
            this.write('\x1b[?1049l');
        }
    }

    public restore(): void {
        if (this.restored) {
            return;
        }

        this.restored = true;
        runCleanupSteps([
            () => {
                this.showCursor();
            },
            () => {
                this.leaveAltScreen();
            },
            () => {
                if (this.ansi) {
                    this.write('\x1b[0m');
                }
            },
        ]);
    }

    private get ansi(): boolean {
        return this.options.ansi ?? true;
    }
}
