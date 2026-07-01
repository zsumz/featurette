import type { Cell, TerminalSize } from '../types.js';

export interface LayerScreen {
    columns: number;
    rows: number;
    size: TerminalSize;
}

export interface LayerEntry {
    x: number;
    y: number;
    cell: Cell;
}
