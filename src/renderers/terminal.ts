import type { Renderer } from '../core/renderer.js';
import type { Frame } from '../core/screen.js';
import type {
    PlaybackMode,
    RenderOptions,
    TranscriptEntry,
} from '../core/types.js';
import { formatTranscriptEntry } from './transcript.js';

const ERASE_LINE = '\x1b[2K';
const FRAME_ROW_SEPARATOR = '\r\n';

export interface WritableLike {
    write(chunk: string): boolean;
}

export interface TerminalRendererOptions {
    output?: WritableLike;
    ansi?: boolean;
    clearOnBegin?: boolean;
    clearOnEnd?: boolean;
    transcriptOverlay?: boolean;
}

export class TerminalRenderer implements Renderer {
    private readonly output: WritableLike;
    private mode: PlaybackMode = 'visual';

    constructor(private readonly options: TerminalRendererOptions = {}) {
        this.output = options.output ?? process.stdout;
    }

    public begin(): void {
        if (this.ansi && (this.options.clearOnBegin ?? true)) {
            this.output.write('\x1b[2J\x1b[H');
        }
    }

    public setMode(mode: PlaybackMode): void {
        this.mode = mode;
    }

    public render(frame: Frame, options: RenderOptions = {}): void {
        if (this.mode === 'transcript') {
            return;
        }

        if (this.ansi) {
            const rows = frame
                .toString({ ...options, color: options.color ?? true })
                .split('\n');

            this.output.write('\x1b[H');
            this.output.write(rows.map((row) => `${ERASE_LINE}${row}`).join(FRAME_ROW_SEPARATOR));
            this.output.write('\x1b[0m');
            return;
        }

        this.output.write(frame.toString({ ...options, color: false }));
        this.output.write('\n');
    }

    public transcript(entry: TranscriptEntry): void {
        if (this.mode === 'transcript') {
            this.output.write(`${formatTranscriptEntry(entry)}\n`);
            return;
        }

        if (this.options.transcriptOverlay) {
            this.output.write(`\n${entry.text}`);
        }
    }

    public end(): void {
        if (!this.ansi) {
            return;
        }

        this.output.write('\x1b[0m');

        if (this.options.clearOnEnd) {
            this.output.write('\x1b[2J\x1b[H');
        }
    }

    private get ansi(): boolean {
        return this.options.ansi ?? true;
    }
}
