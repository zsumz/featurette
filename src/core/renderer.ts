import type { Frame } from './screen.js';
import type {
    PlaybackMode,
    RenderOptions,
    TerminalInfo,
    TranscriptEntry,
} from './types.js';

export interface Renderer {
    begin?(info: TerminalInfo): Promise<void> | void;
    setMode?(mode: PlaybackMode, info: TerminalInfo): Promise<void> | void;
    render(frame: Frame, options?: RenderOptions): Promise<void> | void;
    end?(): Promise<void> | void;
    transcript?(entry: TranscriptEntry): Promise<void> | void;
}
