export {
    TerminalTooSmallError,
    assertPlayableSize,
    isTerminalTooSmall,
    planPlayback,
} from './runtime/playback-plan.js';
export { runFilm } from './runtime/run-film.js';
export { resolveTerminalInfo } from './runtime/terminal-info.js';
export type {
    PlaybackMode,
    PlaybackPlan,
    RunFilmOptions,
    RunFilmResult,
} from './runtime/types.js';
