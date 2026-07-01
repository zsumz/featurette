import type { Point } from '../position.js';
import type {
    DrawBoxOptions,
    Position,
    ProgressBarOptions,
    Sprite,
    Style,
} from '../types.js';

export interface DrawAPI {
    text(x: number, y: number, content: string, style?: Style): void;
    box(x: number, y: number, width: number, height: number, options?: DrawBoxOptions): void;
    line(x1: number, y1: number, x2: number, y2: number, style?: Style): void;
    frame(art: string | string[], at?: Position | Point, style?: Style): void;
    sprite(sprite: Sprite, at?: Position | Point, style?: Style): void;
    progressBar(x: number, y: number, width: number, progress: number, options?: ProgressBarOptions): void;
    logs(x: number, y: number, lines: string[], style?: Style): void;
    diff(x: number, y: number, diffText: string, style?: Style): void;
    tree(x: number, y: number, lines: string[], style?: Style): void;
}
