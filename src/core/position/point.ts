import type { AnchorX, AnchorY } from '../types.js';

export class Point {
    constructor(
        public readonly x: AnchorX = 'left',
        public readonly y: AnchorY = 'top',
        public readonly offsetX = 0,
        public readonly offsetY = 0,
    ) {}

    public move(dx: number, dy: number): Point {
        return new Point(this.x, this.y, this.offsetX + dx, this.offsetY + dy);
    }

    public shift(dx: number, dy: number): Point {
        return this.move(dx, dy);
    }

    public right(columns = 1): Point {
        return this.move(columns, 0);
    }

    public left(columns = 1): Point {
        return this.move(-columns, 0);
    }

    public up(rows = 1): Point {
        return this.move(0, -rows);
    }

    public down(rows = 1): Point {
        return this.move(0, rows);
    }

    public dxBy(columns: number): Point {
        return this.move(columns, 0);
    }

    public dyBy(rows: number): Point {
        return this.move(0, rows);
    }

    public dx(columns: number): Point {
        return this.dxBy(columns);
    }

    public dy(rows: number): Point {
        return this.dyBy(rows);
    }
}

export function center(): Point {
    return new Point('center', 'middle');
}
