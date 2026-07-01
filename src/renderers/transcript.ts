import type { Renderer } from '../core/renderer.js';
import type { Frame } from '../core/screen.js';
import type { RenderOptions, TerminalInfo, TranscriptEntry } from '../core/types.js';

export class TranscriptRenderer implements Renderer {
    public readonly entries: TranscriptEntry[] = [];
    public readonly frames: string[] = [];
    public terminal?: TerminalInfo;

    public begin(info: TerminalInfo): void {
        this.terminal = info;
    }

    public render(frame: Frame, options: RenderOptions = {}): void {
        this.frames.push(frame.toString({ ...options, color: false }));
    }

    public transcript(entry: TranscriptEntry): void {
        this.entries.push(entry);
    }

    public toString(): string {
        return this.entries.map(formatEntry).join('\n');
    }
}

function formatEntry(entry: TranscriptEntry): string {
    const voice = entry.voice ? `${entry.voice}: ` : '';
    return `${voice}${entry.text}`;
}
