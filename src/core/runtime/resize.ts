import type { Screen } from '../screen.js';
import type { TerminalInfo } from '../types.js';

export interface ResizeEvent {
    previous: TerminalInfo;
    current: TerminalInfo;
}

export type ResizeHandler = (event: ResizeEvent) => void | Promise<void>;

export interface TerminalResizeSource {
    current(): Partial<TerminalInfo>;
    onResize(handler: () => void): () => void;
}

export class RuntimeResizeState {
    private pending = false;
    private readonly offResize?: () => void;

    constructor(
        public readonly terminal: TerminalInfo,
        private readonly source?: TerminalResizeSource,
    ) {
        this.offResize = source?.onResize(() => {
            this.pending = true;
        });
    }

    public consume(screen: Screen): ResizeEvent | undefined {
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
        screen.resize(current);

        return { previous, current: { ...current } };
    }

    public dispose(): void {
        this.offResize?.();
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
