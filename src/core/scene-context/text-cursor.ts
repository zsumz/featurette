import type { Point } from '../position.js';
import { resolvePosition, stringCellWidth } from '../position.js';
import type { Screen } from '../screen.js';
import type { Position } from '../types.js';

export interface TextCursor {
    x: number;
    y: number;
}

export class SceneTextCursor {
    private cursor: TextCursor = { x: 0, y: 0 };

    public reset(): void {
        this.cursor = { x: 0, y: 0 };
    }

    public moveTo(cursor: TextCursor): void {
        this.cursor = cursor;
    }

    public resolve(text: string, at: Position | Point | undefined, screen: Screen): TextCursor {
        if (at) {
            const lines = text.split(/\r?\n/);
            const width = Math.max(0, ...lines.map((line) => stringCellWidth(line)));
            return resolvePosition(at, screen.size, width, lines.length);
        }

        return this.cursor;
    }

    public advance(origin: TextCursor, text: string, advance: 'cursor' | 'line' | 'none', screen: Screen): void {
        if (advance === 'none') {
            return;
        }

        const lines = text.split(/\r?\n/);
        const last = lines.at(-1) ?? '';

        if (advance === 'line') {
            this.cursor = { x: 0, y: Math.min(screen.rows - 1, origin.y + lines.length) };
            return;
        }

        this.cursor = {
            x: Math.min(screen.columns - 1, origin.x + stringCellWidth(last)),
            y: Math.min(screen.rows - 1, origin.y + lines.length - 1),
        };
    }
}
