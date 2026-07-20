import type { Clock } from '../clock.js';
import type { InputController } from '../input.js';
import type { Renderer } from '../renderer.js';
import type { PlaybackMode, TerminalInfo } from '../types.js';
import type { TerminalResizeSource } from './resize.js';

export type { PlaybackMode } from '../types.js';

export type PlaybackFallbackReason = 'requested' | 'non-tty' | 'too-small' | 'resize';

export interface PlaybackPlan {
    terminal: TerminalInfo;
    mode: PlaybackMode;
    tooSmall: boolean;
    fallbackReason?: PlaybackFallbackReason;
}

export interface PlaybackModeChangeEvent {
    previous: PlaybackMode;
    current: PlaybackMode;
    reason: Extract<PlaybackFallbackReason, 'too-small' | 'resize'>;
    terminal: TerminalInfo;
}

export interface RunFilmOptions {
    renderer: Renderer;
    clock?: Clock;
    input?: InputController;
    terminal?: Partial<TerminalInfo>;
    scene?: string;
    color?: boolean;
    unicode?: boolean;
    reducedMotion?: boolean;
    skip?: boolean;
    speed?: number;
    transcript?: boolean;
    transcriptWhenNonTTY?: boolean;
    resizeSource?: TerminalResizeSource;
    onModeChange?: (event: PlaybackModeChangeEvent) => void | Promise<void>;
}

export interface RunFilmResult {
    elapsed: number;
    scenesPlayed: string[];
    mode: PlaybackMode;
    terminal: TerminalInfo;
    tooSmall: boolean;
    fallbackReason?: PlaybackPlan['fallbackReason'];
}
