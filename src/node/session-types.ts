import type { EventEmitter } from 'node:events';
import type { KeyEvent } from '../core/input.js';
import type { WritableLike } from '../renderers/terminal.js';

export type KeypressKey = Omit<KeyEvent, 'name'> & { name?: string };
type KeypressHandler = (sequence: string, key: KeypressKey) => void;
type DataHandler = (chunk: string | Uint8Array) => void;
type ResizeHandler = () => void;

export interface SignalEmitterLike {
    on(event: 'SIGWINCH', listener: ResizeHandler): this;
    off(event: 'SIGWINCH', listener: ResizeHandler): this;
}

export interface ReadableTTYLike extends EventEmitter {
    isTTY?: boolean;
    isRaw?: boolean;
    readonly readableFlowing?: boolean | null;
    isPaused?: () => boolean;
    pause?: () => unknown;
    resume(): unknown;
    setRawMode?: (mode: boolean) => ReadableTTYLike;
    on(event: 'data', listener: DataHandler): this;
    on(event: 'keypress', listener: KeypressHandler): this;
    off(event: 'data', listener: DataHandler): this;
    off(event: 'keypress', listener: KeypressHandler): this;
}

export interface WritableTTYLike extends WritableLike {
    columns?: number;
    rows?: number;
    isTTY?: boolean;
    getColorDepth?: () => number;
}

export interface TerminalSessionOptions {
    input?: ReadableTTYLike;
    output?: WritableTTYLike;
    exit?: (code: number) => void;
    ansi?: boolean;
    useAltScreen?: boolean;
    signals?: SignalEmitterLike;
}
