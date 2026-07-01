import { charactersOf } from '../graphemes.js';

export function distort(text: string, intensity: number, random: () => number): string {
    const glyphs = '#%@$!*?';

    return charactersOf(text)
        .map((char) => {
            if (/\s/.test(char) || random() > intensity) {
                return char;
            }

            return glyphs[Math.floor(random() * glyphs.length)] ?? '#';
        })
        .join('');
}

export function toLines(value: string | string[]): string[] {
    return Array.isArray(value) ? value : value.split(/\r?\n/);
}
