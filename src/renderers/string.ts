import type { Renderer } from '../core/renderer.js';
import type { Frame } from '../core/screen.js';
import type { RenderOptions, TerminalInfo, TranscriptEntry } from '../core/types.js';

export class StringRenderer implements Renderer {
    public readonly frames: string[] = [];
    public readonly frameRecords: Array<{ elapsed: number; text: string }> = [];
    public readonly entries: TranscriptEntry[] = [];
    public terminal?: TerminalInfo;

    public begin(info: TerminalInfo): void {
        this.terminal = info;
    }

    public render(frame: Frame, options: RenderOptions = {}): void {
        const text = frame.toString({ ...options, color: options.color ?? false });
        this.frames.push(text);
        this.frameRecords.push({ elapsed: frame.elapsed, text });
    }

    public transcript(entry: TranscriptEntry): void {
        this.entries.push(entry);
    }

    public lastFrame(): string {
        return this.frames.at(-1) ?? '';
    }

    public transcriptText(): string {
        return this.entries.map((entry) => entry.text).join('\n');
    }
}
