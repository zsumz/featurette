import type { InputController } from '../core/input.js';
import type { Renderer } from '../core/renderer.js';
import type { RunFilmOptions } from '../core/runtime.js';
import type { TerminalInfo } from '../core/types.js';
import type { TerminalRendererOptions } from '../renderers/terminal.js';
import type { TerminalSessionOptions } from './session-types.js';

export interface PlayOptions extends Omit<RunFilmOptions, 'renderer' | 'input'>, TerminalSessionOptions {
    ansi?: boolean;
    renderer?: Renderer;
    controller?: InputController;
    useAltScreen?: boolean;
    terminalRenderer?: TerminalRendererOptions;
}

export interface PlayCliOptions extends PlayOptions {
    argv?: string[];
}

export function toRunFilmOptions(options: PlayOptions): Omit<RunFilmOptions, 'renderer' | 'input'> {
    return {
        clock: options.clock,
        terminal: options.terminal,
        scene: options.scene,
        color: options.color,
        unicode: options.unicode,
        reducedMotion: options.reducedMotion,
        skip: options.skip,
        speed: options.speed,
        transcript: options.transcript,
        transcriptWhenNonTTY: options.transcriptWhenNonTTY,
        resizeSource: options.resizeSource,
        onModeChange: options.onModeChange,
    };
}

export function terminalInfoFromOutput(output: TerminalSessionOptions['output']): Partial<TerminalInfo> {
    return {
        columns: output?.columns,
        rows: output?.rows,
        isTTY: output?.isTTY,
        colorDepth: typeof output?.getColorDepth === 'function' ? output.getColorDepth() : undefined,
        unicode: process.env.LC_ALL !== 'C',
    };
}
