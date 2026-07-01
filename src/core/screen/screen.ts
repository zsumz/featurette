import { createCells } from './cells.js';
import { Frame } from './frame.js';
import { Layer } from './layer.js';
import type { LayerOptions, RenderOptions, TerminalSize } from '../types.js';

export class Screen {
    private readonly layers: Map<string, Layer> = new Map();

    constructor(
        public readonly columns: number,
        public readonly rows: number,
    ) {
        this.layer('main', { zIndex: 0 });
    }

    public get size(): TerminalSize {
        return { columns: this.columns, rows: this.rows };
    }

    public layer(name: string, options: LayerOptions = {}): Layer {
        const existing = this.layers.get(name);

        if (existing) {
            existing.configure(options);
            return existing;
        }

        const layer = new Layer(this, name, options);
        this.layers.set(name, layer);
        return layer;
    }

    public clear(layerName?: string): void {
        if (layerName) {
            this.layer(layerName).clear();
            return;
        }

        for (const layer of this.layers.values()) {
            layer.clear();
        }
    }

    public compose(elapsed = 0, options: ScreenComposeOptions = {}): Frame {
        const cells = createCells(this.columns, this.rows);
        const offset = options.offset ?? { x: 0, y: 0 };
        const layers = [...this.layers.values()]
            .filter((layer) => !layer.hidden)
            .sort((a, b) => a.zIndex - b.zIndex);

        for (const layer of layers) {
            for (const { x, y, cell } of layer.entries()) {
                const renderX = x + Math.trunc(offset.x ?? 0);
                const renderY = y + Math.trunc(offset.y ?? 0);

                if (renderX >= 0 && renderX < this.columns && renderY >= 0 && renderY < this.rows) {
                    cells[renderY][renderX] = cell;
                }
            }
        }

        return new Frame(this.columns, this.rows, cells, elapsed);
    }
}

export function createScreen(size: TerminalSize): Screen {
    return new Screen(size.columns, size.rows);
}

export function frameToString(frame: Frame, options: RenderOptions = {}): string {
    return frame.toString(options);
}

export interface ScreenComposeOptions {
    offset?: {
        x?: number;
        y?: number;
    };
}

export { Frame } from './frame.js';
export { Layer } from './layer.js';
