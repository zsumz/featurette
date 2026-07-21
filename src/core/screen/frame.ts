import { ANSI_RESET, styleKey, styleToAnsi } from '../style.js';
import type { Cell, FrameStringOptions } from '../types.js';

export class Frame {
    constructor(
        public readonly columns: number,
        public readonly rows: number,
        public readonly cells: Cell[][],
        public readonly elapsed: number,
    ) {}

    public toString(options: FrameStringOptions = {}): string {
        const color = options.color ?? false;
        const palette = options.palette ?? {};
        const unicode = options.unicode ?? true;
        const renderedRows: string[] = [];

        for (const row of this.cells) {
            let currentStyleKey = '';
            let line = '';

            for (const cell of row) {
                if (color) {
                    const nextStyleKey = styleKey(cell.style);

                    if (nextStyleKey !== currentStyleKey) {
                        line += ANSI_RESET;
                        line += styleToAnsi(cell.style, palette, color);
                        currentStyleKey = nextStyleKey;
                    }
                }

                line += unicode ? cell.char : asciiFallback(cell.char);
            }

            if (color && currentStyleKey) {
                line += ANSI_RESET;
            }

            renderedRows.push(line.replace(/\s+$/u, ''));
        }

        return renderedRows.join('\n');
    }
}

function asciiFallback(char: string): string {
    if (char.charCodeAt(0) <= 127) {
        return char;
    }

    return '?';
}
