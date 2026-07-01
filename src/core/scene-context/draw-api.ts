import type { Layer } from '../screen.js';
import type { DrawAPI } from './types.js';

export interface DrawApiHost {
    layer(name: string): Layer;
}

export function createDrawApi(host: DrawApiHost): DrawAPI {
    return {
        text: (x, y, content, style) => host.layer('main').text(x, y, content, style),
        box: (x, y, width, height, style) => host.layer('main').box(x, y, width, height, style),
        line: (x1, y1, x2, y2, style) => host.layer('main').line(x1, y1, x2, y2, style),
        frame: (art, at, style) => host.layer('main').frame(art, at, style),
        sprite: (sprite, at, style) => host.layer('main').sprite(sprite, at, style),
        progressBar: (x, y, width, progress, style) => host.layer('main').progressBar(x, y, width, progress, style),
        logs: (x, y, lines, style) => host.layer('main').logs(x, y, lines, style),
        diff: (x, y, diffText, style) => host.layer('main').diff(x, y, diffText, style),
        tree: (x, y, lines, style) => host.layer('main').tree(x, y, lines, style),
    };
}
