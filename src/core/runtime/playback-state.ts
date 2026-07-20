import type { Renderer } from '../renderer.js';
import type { PlaybackMode, TerminalInfo } from '../types.js';
import type {
    PlaybackFallbackReason,
    PlaybackModeChangeEvent,
    PlaybackPlan,
} from './types.js';

type LiveFallbackReason = PlaybackModeChangeEvent['reason'];

export class RuntimePlaybackState {
    public mode: PlaybackMode;
    public tooSmall: boolean;
    public fallbackReason?: PlaybackFallbackReason;

    constructor(
        plan: PlaybackPlan,
        private readonly renderer: Renderer,
        private readonly onModeChange?: (event: PlaybackModeChangeEvent) => void | Promise<void>,
    ) {
        this.mode = plan.mode;
        this.tooSmall = plan.tooSmall;
        this.fallbackReason = plan.fallbackReason;
    }

    public async begin(terminal: TerminalInfo): Promise<void> {
        await this.renderer.setMode?.(this.mode, terminal);
    }

    public updateSize(tooSmall: boolean): void {
        this.tooSmall = tooSmall;
    }

    public async useTranscript(
        reason: LiveFallbackReason,
        terminal: TerminalInfo,
    ): Promise<void> {
        if (this.mode === 'transcript') {
            return;
        }

        const previous = this.mode;
        this.mode = 'transcript';
        this.fallbackReason = reason;
        const event: PlaybackModeChangeEvent = {
            previous,
            current: this.mode,
            reason,
            terminal: { ...terminal },
        };

        await this.onModeChange?.(event);
        await this.renderer.setMode?.(this.mode, terminal);
    }
}
