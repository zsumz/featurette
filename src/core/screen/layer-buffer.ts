import { charactersOf } from '../graphemes.js';
import { charCellWidth } from '../position.js';
import type { Cell, Style } from '../types.js';
import type { LayerEntry, LayerScreen } from './layer-types.js';

export class LayerBuffer {
    private readonly cells: Map<string, Cell> = new Map();

    constructor(private readonly screen: LayerScreen) {}

    public clear(): void {
        this.cells.clear();
    }

    public entries(): LayerEntry[] {
        return [...this.cells.entries()].map(([key, cell]) => {
            const [x = 0, y = 0] = key.split(',').map(Number);
            return { x, y, cell };
        });
    }

    public writeLine(x: number, y: number, content: string, style?: Style): void {
        let cursor = x;

        for (const char of charactersOf(content)) {
            cursor = this.putCellAware(cursor, y, char, style);
        }
    }

    public putCellAware(x: number, y: number, char: string, style?: Style): number {
        const width = charCellWidth(char);

        if (width === 0) {
            return x;
        }

        this.put(x, y, char, style);

        if (width > 1) {
            for (let index = 1; index < width; index += 1) {
                this.put(x + index, y, ' ', style);
            }
        }

        return x + width;
    }

    public put(x: number, y: number, char: string, style?: Style): void {
        if (x < 0 || y < 0 || x >= this.screen.columns || y >= this.screen.rows) {
            return;
        }

        this.cells.set(`${String(x)},${String(y)}`, { char, style });
    }
}
