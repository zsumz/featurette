import type { FeaturetteFilm } from '../film.js';
import type { TerminalInfo, TerminalSize, TooSmallBehavior } from '../types.js';
import type { PlaybackPlan } from './types.js';

export class TerminalTooSmallError extends Error {
    constructor(
        public readonly actual: TerminalSize,
        public readonly minimum: TerminalSize,
        public readonly behavior: TooSmallBehavior,
    ) {
        super(
            `Terminal is ${String(actual.columns)}x${String(actual.rows)}; "${behavior}" playback requires at least ${String(minimum.columns)}x${String(minimum.rows)}.`,
        );
        this.name = 'TerminalTooSmallError';
    }
}

export function planPlayback(
    film: FeaturetteFilm,
    terminal: TerminalInfo,
    options: { transcript?: boolean; transcriptWhenNonTTY?: boolean } = {},
): PlaybackPlan {
    const tooSmall = isTerminalTooSmall(film.options.minSize, terminal);

    if (options.transcript) {
        return { terminal, mode: 'transcript', tooSmall, fallbackReason: 'requested' };
    }

    if (options.transcriptWhenNonTTY && !terminal.isTTY) {
        return { terminal, mode: 'transcript', tooSmall, fallbackReason: 'non-tty' };
    }

    if (tooSmall && (film.options.tooSmall ?? 'resize') === 'transcript') {
        return { terminal, mode: 'transcript', tooSmall, fallbackReason: 'too-small' };
    }

    return { terminal, mode: 'visual', tooSmall };
}

export function isTerminalTooSmall(
    minimum: TerminalSize | undefined,
    actual: TerminalSize,
): boolean {
    if (!minimum) {
        return false;
    }

    return actual.columns < minimum.columns || actual.rows < minimum.rows;
}

export function assertPlayableSize(film: FeaturetteFilm, plan: PlaybackPlan): void {
    const minimum = film.options.minSize;

    if (!minimum || !plan.tooSmall || plan.mode === 'transcript') {
        return;
    }

    const behavior = film.options.tooSmall ?? 'resize';

    if (behavior === 'play') {
        return;
    }

    throw new TerminalTooSmallError(plan.terminal, minimum, behavior);
}
