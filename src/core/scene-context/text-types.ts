import type { Point } from '../position.js';
import type { Position, Style } from '../types.js';

export interface TypeOptions extends Style {
    at?: Position | Point;
    voice?: string;
    speed?: number;
    cursor?: string;
    layer?: string;
    transcript?: boolean;
    advance?: 'cursor' | 'line' | 'none';
}

export interface SayOptions extends Omit<TypeOptions, 'voice'> {
    voice?: string;
}

export interface ClearOptions {
    layer?: string;
}

export interface FadeOptions {
    layer?: string;
}
