export { defineFilm, FeaturetteFilm, type Film, type InterruptHandler, type Scene } from './core/film.js';
export {
    SceneControlError,
    type DrawAPI,
    type EffectsAPI,
    type InputAPI,
    type CountdownOptions,
    type GlitchOptions,
    type LogStreamOptions,
    type MergeConflictOptions,
    type ProgressEffectOptions,
    type ScanlinesOptions,
    type ScreenShakeOptions,
    type SceneContext,
    type SceneTask,
    type TypeOptions,
    type SayOptions,
    type StarfieldOptions,
    type TestRunnerLine,
    type TestRunnerOptions,
    type TitleCardOptions,
} from './core/context.js';
export { Point, center, charCellWidth, stringCellWidth, stripAnsi } from './core/position.js';
export { sprite } from './core/sprite.js';
export { Frame, Layer, Screen, createScreen, frameToString, type ScreenComposeOptions } from './core/screen.js';
export { FakeClock, RealClock, type Clock } from './core/clock.js';
export { InputController, type KeyEvent, type KeyHandler } from './core/input.js';
export {
    TerminalTooSmallError,
    assertPlayableSize,
    isTerminalTooSmall,
    planPlayback,
    runFilm,
    type PlaybackMode,
    type PlaybackPlan,
    type RunFilmOptions,
    type RunFilmResult,
} from './core/runtime.js';
export { StringRenderer } from './renderers/string.js';
export { TerminalRenderer, type TerminalRendererOptions, type WritableLike } from './renderers/terminal.js';
export { TranscriptRenderer } from './renderers/transcript.js';
export { play, playCli, type PlayCliOptions, type PlayOptions } from './node/play-cli.js';
export {
    TerminalSession,
    withTerminalSession,
    type ReadableTTYLike,
    type TerminalSessionOptions,
    type WritableTTYLike,
} from './node/session.js';
export type {
    Cell,
    ColorValue,
    DrawBoxOptions,
    FilmOptions,
    FrameStringOptions,
    HexColor,
    LayerOptions,
    Position,
    ProgressBarOptions,
    RenderOptions,
    ResizeMode,
    Sprite,
    SpriteDefinition,
    Style,
    TerminalInfo,
    TerminalSize,
    TooSmallBehavior,
    TranscriptEntry,
    Voice,
} from './core/types.js';
