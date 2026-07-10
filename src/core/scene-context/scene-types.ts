import type { InterruptHandler } from '../film.js';
import type { Point } from '../position.js';
import type { ResizeHandler } from '../runtime.js';
import type { Layer, Screen } from '../screen.js';
import type { TerminalInfo } from '../types.js';
import type { DrawAPI } from './draw-types.js';
import type { EffectsAPI } from './effects-types.js';
import type { InputAPI } from './input-types.js';
import type { ClearOptions, FadeOptions, SayOptions, TypeOptions } from './text-types.js';

export type SceneTask = () => void | Promise<void>;

export interface SceneContext {
    readonly screen: Screen;
    readonly draw: DrawAPI;
    readonly effects: EffectsAPI;
    readonly input: InputAPI;
    readonly terminal: TerminalInfo;
    readonly sceneName: string;

    layer(name: string, options?: { zIndex?: number; hidden?: boolean }): Layer;
    clear(options?: ClearOptions): Promise<void>;
    beat(ms?: number): Promise<void>;
    wait(ms?: number): Promise<void>;
    cut(): Promise<void>;
    type(text: string, options?: TypeOptions): Promise<void>;
    say(voice: string, text: string, options?: SayOptions): Promise<void>;
    backspace(count: number, options?: TypeOptions): Promise<void>;
    replace(from: string, to: string, options?: TypeOptions): Promise<void>;
    reveal(text: string, options?: TypeOptions & { mode?: 'type' | 'fade'; duration?: number }): Promise<void>;
    redact(text: string, options?: TypeOptions): Promise<void>;
    glitchText(text: string, options?: TypeOptions & { duration?: number; intensity?: number }): Promise<void>;
    fadeIn(duration?: number, draw?: () => void | Promise<void>, options?: FadeOptions): Promise<void>;
    fadeOut(duration?: number, options?: FadeOptions): Promise<void>;
    parallel(tasks: SceneTask[]): Promise<void>;
    sequence(tasks: SceneTask[]): Promise<void>;
    race<T>(tasks: Array<() => T | Promise<T>>): Promise<T>;
    center(): Point;
    onInterrupt(handler: InterruptHandler): void;
    onResize(handler: ResizeHandler): () => void;
    skipScene(): never;
    quit(): never;
    exit(): never;
}

export interface SceneRuntimeOptions {
    color?: boolean;
    unicode?: boolean;
    reducedMotion?: boolean;
    skip?: boolean;
    speed?: number;
}
