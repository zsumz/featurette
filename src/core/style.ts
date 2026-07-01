import type { Style } from './types.js';

const NAMED_FG: Partial<Record<string, number>> = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    gray: 90,
    grey: 90,
    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97,
};

export const ANSI_RESET = '\x1b[0m';

export function mergeStyle(...styles: Array<Style | undefined>): Style | undefined {
    const merged: Style = {};

    for (const style of styles) {
        if (!style) {
            continue;
        }

        Object.assign(merged, style);
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
}

export function styleToAnsi(
    style: Style | undefined,
    palette: Record<string, string> = {},
    color = true,
): string {
    if (!style) {
        return '';
    }

    const codes: string[] = [];

    if (style.bold) codes.push('1');
    if (style.dim) codes.push('2');
    if (style.italic) codes.push('3');
    if (style.underline) codes.push('4');
    if (style.inverse) codes.push('7');

    if (color && style.fg) {
        const fg = colorCode(style.fg, palette, false);
        if (fg) codes.push(fg);
    }

    if (color && style.bg) {
        const bg = colorCode(style.bg, palette, true);
        if (bg) codes.push(bg);
    }

    return codes.length > 0 ? `\x1b[${codes.join(';')}m` : '';
}

export function styleKey(style: Style | undefined): string {
    if (!style) {
        return '';
    }

    return JSON.stringify({
        fg: style.fg,
        bg: style.bg,
        bold: !!style.bold,
        dim: !!style.dim,
        italic: !!style.italic,
        underline: !!style.underline,
        inverse: !!style.inverse,
    });
}

function colorCode(
    color: string,
    palette: Record<string, string>,
    background: boolean,
): string | undefined {
    const resolved = palette[color] ?? color;
    const named = NAMED_FG[resolved];

    if (named !== undefined) {
        return String(background ? named + 10 : named);
    }

    const normalized = resolved.startsWith('#') ? resolved.slice(1) : resolved;
    const prefix = background ? '48' : '38';

    if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
        return [
            prefix,
            '2',
            String(parseInt(`${normalized.charAt(0)}${normalized.charAt(0)}`, 16)),
            String(parseInt(`${normalized.charAt(1)}${normalized.charAt(1)}`, 16)),
            String(parseInt(`${normalized.charAt(2)}${normalized.charAt(2)}`, 16)),
        ].join(';');
    }

    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return [
            prefix,
            '2',
            String(parseInt(normalized.slice(0, 2), 16)),
            String(parseInt(normalized.slice(2, 4), 16)),
            String(parseInt(normalized.slice(4, 6), 16)),
        ].join(';');
    }

    return undefined;
}
