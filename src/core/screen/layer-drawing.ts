import { charactersOf } from '../graphemes.js';
import type { Point } from '../position.js';
import { center, resolvePosition, stringCellWidth } from '../position.js';
import { mergeStyle } from '../style.js';
import type { DrawBoxOptions, Position, ProgressBarOptions, Sprite, Style } from '../types.js';
import type { LayerScreen } from './layer-types.js';

export interface LayerDrawingTarget {
    screen: LayerScreen;
    put(x: number, y: number, char: string, style?: Style): void;
    putCellAware(x: number, y: number, char: string, style?: Style): number;
    text(x: number, y: number, content: string, style?: Style): void;
    writeLine(x: number, y: number, content: string, style?: Style): void;
}

export function drawBox(
    target: LayerDrawingTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawBoxOptions = {},
): void {
    if (width < 2 || height < 2) {
        return;
    }

    const borderStyle = mergeStyle(options, options.borderStyle);
    const fill = options.fill ?? ' ';

    for (let row = y + 1; row < y + height - 1; row += 1) {
        for (let col = x + 1; col < x + width - 1; col += 1) {
            target.put(col, row, fill, options);
        }
    }

    target.put(x, y, '+', borderStyle);
    target.put(x + width - 1, y, '+', borderStyle);
    target.put(x, y + height - 1, '+', borderStyle);
    target.put(x + width - 1, y + height - 1, '+', borderStyle);

    for (let col = x + 1; col < x + width - 1; col += 1) {
        target.put(col, y, '-', borderStyle);
        target.put(col, y + height - 1, '-', borderStyle);
    }

    for (let row = y + 1; row < y + height - 1; row += 1) {
        target.put(x, row, '|', borderStyle);
        target.put(x + width - 1, row, '|', borderStyle);
    }

    if (options.title) {
        target.text(x + 2, y, ` ${options.title} `, borderStyle);
    }
}

export function drawLine(
    target: LayerDrawingTarget,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style?: Style,
): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;
    let reachedEnd = false;

    while (!reachedEnd) {
        target.put(x, y, dx > dy ? '-' : '|', style);
        reachedEnd = x === x2 && y === y2;

        if (reachedEnd) continue;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }

        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

export function drawFrame(
    target: LayerDrawingTarget,
    art: string | string[],
    at: Position | Point = center(),
    style?: Style,
): void {
    const lines = Array.isArray(art) ? art : art.replace(/^\n/, '').replace(/\n$/u, '').split(/\r?\n/);
    const width = Math.max(0, ...lines.map((line) => stringCellWidth(line)));
    const origin = resolvePosition(at, target.screen.size, width, lines.length);

    lines.forEach((line, rowIndex) => {
        target.writeLine(origin.x, origin.y + rowIndex, line, style);
    });
}

export function drawSprite(
    target: LayerDrawingTarget,
    sprite: Sprite,
    at: Position | Point = center(),
    style?: Style,
): void {
    const width = Math.max(0, ...sprite.lines.map((line) => stringCellWidth(line)));
    const origin = resolvePosition(at, target.screen.size, width, sprite.lines.length);

    sprite.lines.forEach((line, rowIndex) => {
        let x = origin.x;

        for (const char of charactersOf(line)) {
            const cellStyle = mergeStyle(style, sprite.map?.[char]);
            x = target.putCellAware(x, origin.y + rowIndex, char, cellStyle);
        }
    });
}

export function drawProgressBar(
    target: LayerDrawingTarget,
    x: number,
    y: number,
    width: number,
    progress: number,
    options: ProgressBarOptions = {},
): void {
    const completeChar = options.completeChar ?? '#';
    const incompleteChar = options.incompleteChar ?? '-';
    const clamped = Math.min(1, Math.max(0, progress));
    const complete = Math.round(width * clamped);
    const bar = `${completeChar.repeat(complete)}${incompleteChar.repeat(Math.max(0, width - complete))}`;
    const label = options.label ? `${options.label} ` : '';

    target.text(x, y, `${label}[${bar}]`, options);
}

export function drawLogs(
    target: LayerDrawingTarget,
    x: number,
    y: number,
    lines: string[],
    style?: Style,
): void {
    lines.forEach((line, index) => {
        target.text(x, y + index, line, style);
    });
}

export function drawDiff(
    target: LayerDrawingTarget,
    x: number,
    y: number,
    diffText: string,
    style?: Style,
): void {
    diffText.split(/\r?\n/).forEach((line, index) => {
        const lineStyle = mergeStyle(
            style,
            line.startsWith('+') ? { fg: 'green' } : line.startsWith('-') ? { fg: 'red' } : undefined,
        );
        target.text(x, y + index, line, lineStyle);
    });
}

export function drawTree(
    target: LayerDrawingTarget,
    x: number,
    y: number,
    lines: string[],
    style?: Style,
): void {
    lines.forEach((line, index) => {
        const prefix = index === lines.length - 1 ? '`- ' : '|- ';
        target.text(x, y + index, `${prefix}${line}`, style);
    });
}
