import type { Point } from '../position.js';
import { resolvePosition, stringCellWidth } from '../position.js';
import type {
    DrawBoxOptions,
    LayerOptions,
    Position,
    ProgressBarOptions,
    Sprite,
    Style,
} from '../types.js';
import { LayerBuffer } from './layer-buffer.js';
import {
    drawBox,
    drawDiff,
    drawFrame,
    drawLine,
    drawLogs,
    drawProgressBar,
    drawSprite,
    drawTree,
    type LayerDrawingTarget,
} from './layer-drawing.js';
import type { LayerEntry, LayerScreen } from './layer-types.js';

export class Layer {
    private readonly buffer: LayerBuffer;
    private readonly drawingTarget: LayerDrawingTarget;
    public zIndex: number;
    public hidden: boolean;

    constructor(
        private readonly screen: LayerScreen,
        public readonly name: string,
        options: LayerOptions = {},
    ) {
        this.buffer = new LayerBuffer(screen);
        this.drawingTarget = {
            screen,
            put: (x, y, char, style) => {
                this.buffer.put(x, y, char, style);
            },
            putCellAware: (x, y, char, style) => this.buffer.putCellAware(x, y, char, style),
            text: (x, y, content, style) => {
                this.text(x, y, content, style);
            },
            writeLine: (x, y, content, style) => {
                this.buffer.writeLine(x, y, content, style);
            },
        };
        this.zIndex = options.zIndex ?? 0;
        this.hidden = options.hidden ?? false;
    }

    public configure(options: LayerOptions): void {
        if (options.zIndex !== undefined) {
            this.zIndex = options.zIndex;
        }

        if (options.hidden !== undefined) {
            this.hidden = options.hidden;
        }
    }

    public clear(): this {
        this.buffer.clear();
        return this;
    }

    public text(x: number, y: number, content: string, style?: Style): this;
    public text(at: Position | Point, content: string, style?: Style): this;
    public text(
        xOrAt: number | Position | Point,
        yOrContent: number | string,
        contentOrStyle?: string | Style,
        maybeStyle?: Style,
    ): this {
        const content = typeof xOrAt === 'number'
            ? typeof contentOrStyle === 'string' ? contentOrStyle : ''
            : typeof yOrContent === 'string' ? yOrContent : String(yOrContent);
        const style = typeof xOrAt === 'number'
            ? maybeStyle
            : contentOrStyle as Style | undefined;
        const lines = content.split(/\r?\n/);
        const width = Math.max(0, ...lines.map((line) => stringCellWidth(line)));
        const height = lines.length;
        const origin =
            typeof xOrAt === 'number'
                ? { x: xOrAt, y: Number(yOrContent) }
                : resolvePosition(xOrAt, this.screen.size, width, height);

        lines.forEach((line, rowIndex) => {
            this.buffer.writeLine(origin.x, origin.y + rowIndex, line, style);
        });

        return this;
    }

    public box(x: number, y: number, width: number, height: number, options: DrawBoxOptions = {}): this {
        drawBox(this.drawingTarget, x, y, width, height, options);
        return this;
    }

    public line(x1: number, y1: number, x2: number, y2: number, style?: Style): this {
        drawLine(this.drawingTarget, x1, y1, x2, y2, style);
        return this;
    }

    public frame(art: string | string[], at?: Position | Point, style?: Style): this {
        drawFrame(this.drawingTarget, art, at, style);
        return this;
    }

    public sprite(sprite: Sprite, at?: Position | Point, style?: Style): this {
        drawSprite(this.drawingTarget, sprite, at, style);
        return this;
    }

    public progressBar(
        x: number,
        y: number,
        width: number,
        progress: number,
        options: ProgressBarOptions = {},
    ): this {
        drawProgressBar(this.drawingTarget, x, y, width, progress, options);
        return this;
    }

    public logs(x: number, y: number, lines: string[], style?: Style): this {
        drawLogs(this.drawingTarget, x, y, lines, style);
        return this;
    }

    public diff(x: number, y: number, diffText: string, style?: Style): this {
        drawDiff(this.drawingTarget, x, y, diffText, style);
        return this;
    }

    public tree(x: number, y: number, lines: string[], style?: Style): this {
        drawTree(this.drawingTarget, x, y, lines, style);
        return this;
    }

    public entries(): LayerEntry[] {
        return this.buffer.entries();
    }
}
