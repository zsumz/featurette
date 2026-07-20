export { play, playCli, type PlayCliOptions, type PlayOptions } from './node/play-cli.js';
export {
    TerminalSession,
    withTerminalSession,
} from './node/session.js';
export type {
    ReadableTTYLike,
    TerminalSessionOptions,
    WritableTTYLike,
} from './node/session-types.js';
export { TerminalRenderer, type TerminalRendererOptions, type WritableLike } from './renderers/terminal.js';
export { TerminalTooSmallError, planPlayback } from './core/runtime.js';
export {
    doctor,
    formatDoctorReport,
    inspectTerminal,
    type DoctorOptions,
    type DoctorReport,
} from './node/doctor.js';
