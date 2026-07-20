import { createCells } from '../screen/cells.js';
import { Frame } from '../screen/frame.js';
import type { ResizeMode, TerminalSize } from '../types.js';

type ViewportMode = Extract<ResizeMode, 'crop' | 'letterbox'>;

export function fitFrameToViewport(
    frame: Frame,
    viewport: TerminalSize,
    mode: ViewportMode,
): Frame {
    const columns = Math.max(1, Math.floor(viewport.columns));
    const rows = Math.max(1, Math.floor(viewport.rows));

    if (frame.columns === columns && frame.rows === rows) {
        return frame;
    }

    const cells = createCells(columns, rows);
    const horizontal = fitAxis(frame.columns, columns, mode);
    const vertical = fitAxis(frame.rows, rows, mode);

    for (let row = 0; row < vertical.length; row += 1) {
        const sourceRow = frame.cells[vertical.source + row];
        const targetRow = cells[vertical.target + row];

        for (let column = 0; column < horizontal.length; column += 1) {
            const cell = sourceRow[horizontal.source + column];
            targetRow[horizontal.target + column] = cell;
        }
    }

    return new Frame(columns, rows, cells, frame.elapsed);
}

interface AxisFit {
    source: number;
    target: number;
    length: number;
}

function fitAxis(source: number, target: number, mode: ViewportMode): AxisFit {
    const length = Math.min(source, target);

    if (mode === 'crop') {
        return { source: 0, target: 0, length };
    }

    return {
        source: Math.max(0, Math.floor((source - target) / 2)),
        target: Math.max(0, Math.floor((target - source) / 2)),
        length,
    };
}
