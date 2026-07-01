import { InputController } from '../core/input.js';
import {
    assertPlayableSize,
    planPlayback,
    resolveTerminalInfo,
    runFilm,
    type RunFilmResult,
} from '../core/runtime.js';
import type { FeaturetteFilm } from '../core/film.js';
import { TerminalRenderer } from '../renderers/terminal.js';
import { withTerminalSession } from './session.js';
import { parsePlayCliFlags } from './play-cli-flags.js';
import {
    terminalInfoFromOutput,
    toRunFilmOptions,
    type PlayCliOptions,
    type PlayOptions,
} from './play-options.js';
import { playTranscript } from './play-transcript.js';

export type { PlayCliOptions, PlayOptions } from './play-options.js';

export async function play(
    film: FeaturetteFilm,
    options: PlayOptions = {},
): Promise<RunFilmResult> {
    if (options.renderer) {
        return runFilm(film, {
            ...toRunFilmOptions(options),
            transcript: options.transcript,
            renderer: options.renderer,
        });
    }

    const output = options.output ?? process.stdout;
    const terminal = resolveTerminalInfo(film.options.minSize, {
        ...terminalInfoFromOutput(output),
        ...options.terminal,
    });
    const preflightPlan = planPlayback(film, terminal, {
        transcript: options.transcript,
        transcriptWhenNonTTY: true,
    });

    if (preflightPlan.mode === 'transcript') {
        return playTranscript(film, options, terminal, output);
    }

    assertPlayableSize(film, preflightPlan);

    return withTerminalSession(async (session) => {
        const controller = options.controller ?? new InputController();
        const terminal = { ...session.info, ...options.terminal };
        const plan = planPlayback(film, terminal, {
            transcript: options.transcript,
            transcriptWhenNonTTY: true,
        });

        if (plan.mode === 'transcript') {
            return playTranscript(film, options, terminal, session.output);
        }

        assertPlayableSize(film, plan);

        session.enterAltScreen();
        session.hideCursor();
        session.useRawMode();
        session.bindInput(controller, {
            hardExit: () => {
                session.restore();
            },
        });

        return runFilm(film, {
            ...toRunFilmOptions(options),
            input: controller,
            terminal,
            renderer: new TerminalRenderer({
                output: session.output,
                ...options.terminalRenderer,
            }),
        });
    }, options);
}

export async function playCli(
    film: FeaturetteFilm,
    options: PlayCliOptions = {},
): Promise<RunFilmResult> {
    const flags = parsePlayCliFlags(options.argv ?? process.argv.slice(2));

    return play(film, {
        ...options,
        color: flags.color,
        unicode: !flags.noUnicode,
        reducedMotion: flags.reducedMotion,
        skip: flags.skip,
        speed: flags.speed,
        scene: flags.scene,
        transcript: flags.transcript,
        useAltScreen: !flags.noAltScreen,
    });
}
