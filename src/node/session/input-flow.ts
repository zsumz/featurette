import type { ReadableTTYLike } from '../session-types.js';

export function isInputFlowing(input: ReadableTTYLike): boolean {
    if (input.readableFlowing !== undefined) {
        return input.readableFlowing === true;
    }

    return input.isPaused?.() === false;
}
