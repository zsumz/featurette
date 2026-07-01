import type { Clock } from '../clock.js';
import type { InputController } from '../input.js';
import type { Renderer } from '../renderer.js';
import type { TerminalInfo } from '../types.js';

export type PlaybackMode = 'visual' | 'transcript';

export interface PlaybackPlan {
    terminal: TerminalInfo;
    mode: PlaybackMode;
    tooSmall: boolean;
    fallbackReason?: 'requested' | 'non-tty' | 'too-small';
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
}

export interface RunFilmResult {
    elapsed: number;
    scenesPlayed: string[];
    mode: PlaybackMode;
    terminal: TerminalInfo;
    tooSmall: boolean;
    fallbackReason?: PlaybackPlan['fallbackReason'];
}
