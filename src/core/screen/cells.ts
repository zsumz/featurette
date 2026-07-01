import type { Cell } from '../types.js';

export function createCells(columns: number, rows: number): Cell[][] {
    return Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => ({ char: ' ' }) satisfies Cell),
    );
}
