import { normalizeArtLines } from './position.js';
import type { Sprite, SpriteDefinition } from './types.js';

export function sprite(strings: TemplateStringsArray, ...values: unknown[]): Sprite;
export function sprite(definition: SpriteDefinition): Sprite;
export function sprite(
    input: TemplateStringsArray | SpriteDefinition,
    ...values: unknown[]
): Sprite {
    if ('art' in input) {
        return {
            lines: normalizeArtLines(input.art),
            map: input.map,
        };
    }

    const art = String.raw(input, ...values);
    return { lines: normalizeArtLines(art) };
}
