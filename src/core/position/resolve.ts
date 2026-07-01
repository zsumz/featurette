import type { Position, TerminalSize } from '../types.js';
import { Point } from './point.js';

export function resolvePosition(
    position: Position | Point | undefined,
    terminal: TerminalSize,
    contentWidth = 0,
    contentHeight = 1,
): { x: number; y: number } {
    const at = position ?? { x: 'left', y: 'top' };
    const offsetX = at instanceof Point ? at.offsetX : at.dx ?? 0;
    const offsetY = at instanceof Point ? at.offsetY : at.dy ?? 0;
    const x = resolveX(at.x ?? 'left', terminal.columns, contentWidth) + offsetX;
    const y = resolveY(at.y ?? 'top', terminal.rows, contentHeight) + offsetY;

    return {
        x: clamp(Math.round(x), 0, Math.max(0, terminal.columns - 1)),
        y: clamp(Math.round(y), 0, Math.max(0, terminal.rows - 1)),
    };
}

function resolveX(anchor: Position['x'], columns: number, width: number): number {
    if (typeof anchor === 'number') {
        return anchor;
    }

    if (anchor === 'center') {
        return Math.floor((columns - width) / 2);
    }

    if (anchor === 'right') {
        return columns - width;
    }

    if (anchor?.startsWith('right-')) {
        return columns - width - Number(anchor.slice('right-'.length));
    }

    return 0;
}

function resolveY(anchor: Position['y'], rows: number, height: number): number {
    if (typeof anchor === 'number') {
        return anchor;
    }

    if (anchor === 'middle') {
        return Math.floor((rows - height) / 2);
    }

    if (anchor === 'bottom') {
        return rows - height;
    }

    if (anchor?.startsWith('bottom-')) {
        return rows - height - Number(anchor.slice('bottom-'.length));
    }

    return 0;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
