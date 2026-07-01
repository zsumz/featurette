import type { Point } from '../position.js';
import type { Position, Style } from '../types.js';
import type { FadeOptions, TypeOptions } from './text-types.js';

export interface StarfieldOptions {
    duration?: number;
    density?: number;
    twinkle?: boolean;
    colors?: string[];
    layer?: string;
    seed?: number;
}

export interface LogStreamOptions {
    at?: Position | Point;
    lines: string[];
    voice?: string;
    interval?: number;
    layer?: string;
}

export interface ProgressEffectOptions {
    label?: string;
    from?: number;
    to?: number;
    duration?: number;
    width?: number;
    at?: Position | Point;
    voice?: string;
    failAtEnd?: boolean;
    layer?: string;
}

export interface GlitchOptions {
    duration?: number;
    intensity?: number;
    layer?: string;
}

export interface TitleCardOptions {
    title: string;
    subtitle?: string;
    at?: Position | Point;
    voice?: string;
    duration?: number;
    layer?: string;
    titleStyle?: Style;
    subtitleStyle?: Style;
}

export interface ScanlinesOptions extends Style {
    duration?: number;
    spacing?: number;
    char?: string;
    layer?: string;
}

export interface CountdownOptions extends Style {
    from?: number;
    to?: number;
    finalText?: string;
    interval?: number;
    at?: Position | Point;
    voice?: string;
    layer?: string;
}

export interface TestRunnerLine {
    name: string;
    status?: 'pass' | 'fail' | 'skip';
    detail?: string;
}

export interface TestRunnerOptions {
    at?: Position | Point;
    lines: TestRunnerLine[];
    interval?: number;
    voice?: string;
    layer?: string;
    title?: string;
}

export interface MergeConflictOptions {
    at?: Position | Point;
    ours: string | string[];
    theirs: string | string[];
    oursLabel?: string;
    theirsLabel?: string;
    resolved?: string | string[];
    duration?: number;
    voice?: string;
    layer?: string;
}

export interface ScreenShakeOptions {
    duration?: number;
    intensity?: number;
}

export interface EffectsAPI {
    titleCard(options: TitleCardOptions): Promise<void>;
    fadeIn(duration?: number, draw?: () => void | Promise<void>, options?: FadeOptions): Promise<void>;
    fadeOut(duration?: number, options?: FadeOptions): Promise<void>;
    wipe(text: string, options?: TypeOptions): Promise<void>;
    starfield(options?: StarfieldOptions): Promise<void>;
    logStream(options: LogStreamOptions): Promise<void>;
    progress(options?: ProgressEffectOptions): Promise<void>;
    glitch(options?: GlitchOptions): Promise<void>;
    scanlines(options?: ScanlinesOptions): Promise<void>;
    countdown(options?: CountdownOptions): Promise<void>;
    testRunner(options: TestRunnerOptions): Promise<void>;
    mergeConflict(options: MergeConflictOptions): Promise<void>;
    screenShake(options?: ScreenShakeOptions): Promise<void>;
}
