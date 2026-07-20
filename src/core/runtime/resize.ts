import type { Frame, Screen } from '../screen.js';
import type {
    ResizeMode,
    TerminalInfo,
    TerminalSize,
    TooSmallBehavior,
} from '../types.js';
import { isTerminalTooSmall, TerminalTooSmallError } from './playback-plan.js';
import type { RuntimePlaybackState } from './playback-state.js';
import { fitFrameToViewport } from './viewport.js';

export interface ResizeEvent {
    previous: TerminalInfo;
    current: TerminalInfo;
}

export type ResizeHandler = (event: ResizeEvent) => void | Promise<void>;

export interface TerminalResizeSource {
    current(): Partial<TerminalInfo>;
    onResize(handler: () => void): () => void;
}

interface RuntimeResizeOptions {
    minimum?: TerminalSize;
    mode?: ResizeMode;
    playback: RuntimePlaybackState;
    tooSmall?: TooSmallBehavior;
}

export class RuntimeResizeState {
    private pending = false;
    private readonly offResize?: () => void;
    private readonly stage: TerminalSize;

    constructor(
        public readonly terminal: TerminalInfo,
        private readonly source?: TerminalResizeSource,
        private readonly options?: RuntimeResizeOptions,
    ) {
        this.stage = {
            columns: terminal.columns,
            rows: terminal.rows,
        };
        this.offResize = source?.onResize(() => {
            this.pending = true;
        });
    }

    public get screenSize(): TerminalSize {
        if (this.options?.mode === 'crop' || this.options?.mode === 'letterbox') {
            return { ...this.stage };
        }

        return {
            columns: this.terminal.columns,
            rows: this.terminal.rows,
        };
    }

    public fit(frame: Frame): Frame {
        const mode = this.options?.mode;

        if (mode !== 'crop' && mode !== 'letterbox') {
            return frame;
        }

        return fitFrameToViewport(frame, this.terminal, mode);
    }

    public async consume(screen: Screen): Promise<ResizeEvent | undefined> {
        if (!this.pending || !this.source) {
            return undefined;
        }

        this.pending = false;

        const previous = { ...this.terminal };
        const current = resolveTerminalInfoUpdate(previous, this.source.current());

        if (sameTerminalInfo(previous, current)) {
            return undefined;
        }

        Object.assign(this.terminal, current);
        await this.applyPolicy(screen, current);

        return { previous, current: { ...current } };
    }

    public dispose(): void {
        this.offResize?.();
    }

    private async applyPolicy(screen: Screen, current: TerminalInfo): Promise<void> {
        const tooSmall = isTerminalTooSmall(this.options?.minimum, current);
        this.options?.playback.updateSize(tooSmall);

        if (tooSmall) {
            const behavior = this.options?.tooSmall ?? 'resize';

            if (behavior === 'resize' && this.options?.minimum) {
                throw new TerminalTooSmallError(current, this.options.minimum, behavior);
            }

            if (behavior === 'transcript') {
                await this.options?.playback.useTranscript('too-small', current);
            }
        }

        if (this.options?.mode === 'transcript') {
            await this.options.playback.useTranscript('resize', current);
        }

        if (this.options?.mode !== 'crop' && this.options?.mode !== 'letterbox') {
            screen.resize(current);
        }
    }
}

function resolveTerminalInfoUpdate(
    previous: TerminalInfo,
    update: Partial<TerminalInfo>,
): TerminalInfo {
    return {
        columns: resolveDimension(update.columns, previous.columns),
        rows: resolveDimension(update.rows, previous.rows),
        isTTY: update.isTTY ?? previous.isTTY,
        colorDepth: update.colorDepth ?? previous.colorDepth,
        unicode: update.unicode ?? previous.unicode,
    };
}

function resolveDimension(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(1, Math.floor(value));
}

function sameTerminalInfo(left: TerminalInfo, right: TerminalInfo): boolean {
    return left.columns === right.columns &&
    left.rows === right.rows &&
    left.isTTY === right.isTTY &&
    left.colorDepth === right.colorDepth &&
    left.unicode === right.unicode;
}
