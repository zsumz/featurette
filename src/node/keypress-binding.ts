import readline from 'node:readline';
import { PassThrough } from 'node:stream';
import type { KeypressKey, ReadableTTYLike } from './session-types.js';

type KeypressHandler = (sequence: string, key: KeypressKey) => void;

export function bindKeypressInput(
    input: ReadableTTYLike,
    handler: KeypressHandler,
): () => void {
    const decoder = new PassThrough();
    const onData = (chunk: string | Uint8Array): void => {
        decoder.write(chunk);
    };
    let active = true;

    readline.emitKeypressEvents(decoder);
    decoder.on('keypress', handler);

    try {
        input.on('data', onData);
    } catch (error) {
        decoder.destroy();
        throw error;
    }

    return () => {
        if (!active) {
            return;
        }

        active = false;
        try {
            input.off('data', onData);
        } finally {
            decoder.off('keypress', handler);
            decoder.destroy();
        }
    };
}
