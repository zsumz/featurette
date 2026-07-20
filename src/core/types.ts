export type HexColor = `#${string}`;
export type ColorValue = string;

export interface Style {
    fg?: ColorValue;
    bg?: ColorValue;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    inverse?: boolean;
}

export interface Voice extends Style {
    speed?: number;
    cursor?: string;
    prefix?: string;
    jitter?: boolean;
}

export interface TerminalSize {
    columns: number;
    rows: number;
}

export interface TerminalInfo extends TerminalSize {
    isTTY: boolean;
    colorDepth: number;
    unicode: boolean;
}

export type PlaybackMode = 'visual' | 'transcript';

export type AnchorX = number | 'left' | 'center' | 'right' | `right-${number}`;
export type AnchorY = number | 'top' | 'middle' | 'bottom' | `bottom-${number}`;

export interface Position {
    x?: AnchorX;
    y?: AnchorY;
    dx?: number;
    dy?: number;
}

export interface Cell {
    char: string;
    style?: Style;
}

export interface FrameStringOptions {
    color?: boolean;
    palette?: Record<string, string>;
    unicode?: boolean;
}

export interface DrawBoxOptions extends Style {
    title?: string;
    borderStyle?: Style;
    fill?: string;
}

export interface ProgressBarOptions extends Style {
    label?: string;
    completeChar?: string;
    incompleteChar?: string;
}

export interface LayerOptions {
    zIndex?: number;
    hidden?: boolean;
}

export interface Sprite {
    lines: string[];
    map?: Record<string, Style>;
}

export interface SpriteDefinition {
    art: string;
    map?: Record<string, Style>;
}

export type ResizeMode = 'letterbox' | 'crop' | 'transcript';
export type TooSmallBehavior = 'resize' | 'transcript' | 'play';

export interface FilmOptions {
    title: string;
    fps?: number;
    palette?: Record<string, string>;
    voices?: Record<string, Voice>;
    minSize?: TerminalSize;
    resize?: ResizeMode;
    tooSmall?: TooSmallBehavior;
    transcript?: boolean;
    captions?: boolean;
    reducedMotion?: boolean | Record<string, unknown>;
}

export interface TranscriptEntry {
    elapsed: number;
    scene?: string;
    voice?: string;
    text: string;
}

export interface RenderOptions {
    color?: boolean;
    palette?: Record<string, string>;
    unicode?: boolean;
}
