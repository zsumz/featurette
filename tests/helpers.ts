import { EventEmitter } from 'node:events';
import type { ReadableTTYLike, WritableTTYLike } from '../dist/node.js';

export interface FakeInputOptions {
    isTTY?: boolean;
    isRaw?: boolean;
    rawMode?: boolean;
}

export interface FakeInput extends ReadableTTYLike {
    rawModes: boolean[];
}

export interface FakeOutputOptions {
    isTTY?: boolean;
    columns?: number;
    rows?: number;
    colorDepth?: number;
}

export interface FakeOutput extends WritableTTYLike {
    text(): string;
}

export function createFakeInput(options: FakeInputOptions = {}): FakeInput {
    const input = new EventEmitter() as FakeInput;
    input.isTTY = options.isTTY ?? true;
    input.isRaw = options.isRaw ?? false;
    input.rawModes = [];

    input.resume = () => input;

    if (options.rawMode ?? true) {
        input.setRawMode = (mode: boolean) => {
            input.rawModes.push(mode);
            input.isRaw = mode;
            return input;
        };
    }

    return input;
}

export function createFakeOutput(options: FakeOutputOptions = {}): FakeOutput {
    const chunks: string[] = [];

    return {
        isTTY: options.isTTY ?? false,
        columns: options.columns ?? 80,
        rows: options.rows ?? 24,
        write(chunk: string) {
            chunks.push(chunk);
            return true;
        },
        getColorDepth() {
            return options.colorDepth ?? 24;
        },
        text() {
            return chunks.join('');
        },
    };
}

export async function flushPromises(): Promise<void> {
    await new Promise<void>((resolve) => {
        setImmediate(resolve);
    });
}
