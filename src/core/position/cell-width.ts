import { charactersOf } from '../graphemes.js';

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

export function stripAnsi(value: string): string {
    return value.replace(ANSI_PATTERN, '');
}

export function stringCellWidth(value: string): number {
    let width = 0;

    for (const char of charactersOf(stripAnsi(value))) {
        width += charCellWidth(char);
    }

    return width;
}

export function charCellWidth(char: string): number {
    const code = char.codePointAt(0);

    if (code === undefined) {
        return 0;
    }

    if (code === 0 || code < 32 || code >= 0x7f && code < 0xa0) {
        return 0;
    }

    if (isCombiningMark(code)) {
        return 0;
    }

    if (isWideCodePoint(code)) {
        return 2;
    }

    return 1;
}

function isCombiningMark(code: number): boolean {
    return code >= 0x0300 && code <= 0x036f ||
        code >= 0x1ab0 && code <= 0x1aff ||
        code >= 0x1dc0 && code <= 0x1dff ||
        code >= 0x20d0 && code <= 0x20ff ||
        code >= 0xfe20 && code <= 0xfe2f;
}

function isWideCodePoint(code: number): boolean {
    return code >= 0x1100 && code <= 0x115f ||
        code === 0x2329 ||
        code === 0x232a ||
        code >= 0x2e80 && code <= 0xa4cf ||
        code >= 0xac00 && code <= 0xd7a3 ||
        code >= 0xf900 && code <= 0xfaff ||
        code >= 0xfe10 && code <= 0xfe19 ||
        code >= 0xfe30 && code <= 0xfe6f ||
        code >= 0xff00 && code <= 0xff60 ||
        code >= 0xffe0 && code <= 0xffe6 ||
        code >= 0x1f300 && code <= 0x1faff;
}
