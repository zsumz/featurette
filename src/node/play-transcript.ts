import { FakeClock } from '../core/clock.js';
import { runFilm, type RunFilmResult } from '../core/runtime.js';
import type { FeaturetteFilm } from '../core/film.js';
import type { TerminalInfo } from '../core/types.js';
import { TranscriptRenderer } from '../renderers/transcript.js';
import type { TerminalSessionOptions } from './session-types.js';
import { toRunFilmOptions, type PlayOptions } from './play-options.js';

export async function playTranscript(
    film: FeaturetteFilm,
    options: PlayOptions,
    terminal: Partial<TerminalInfo>,
    output: TerminalSessionOptions['output'],
): Promise<RunFilmResult> {
    const renderer = new TranscriptRenderer();
    const result = await runFilm(film, {
        ...toRunFilmOptions(options),
        renderer,
        clock: options.clock ?? new FakeClock(),
        terminal,
        transcript: options.transcript,
        transcriptWhenNonTTY: true,
        color: false,
        reducedMotion: true,
        skip: true,
    });

    (output ?? process.stdout).write(`${renderer.toString()}\n`);
    return result;
}
