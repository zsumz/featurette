import { RealClock } from '../clock.js';
import { SceneContextImpl, SceneControlError } from '../context.js';
import type { FeaturetteFilm } from '../film.js';
import { InputController } from '../input.js';
import { Screen } from '../screen.js';
import { assertPlayableSize, planPlayback } from './playback-plan.js';
import { resolveTerminalInfo } from './terminal-info.js';
import type { RunFilmOptions, RunFilmResult } from './types.js';

export async function runFilm(
    film: FeaturetteFilm,
    options: RunFilmOptions,
): Promise<RunFilmResult> {
    const terminal = resolveTerminalInfo(film.options.minSize, options.terminal);
    const plan = planPlayback(film, terminal, {
        transcript: options.transcript,
        transcriptWhenNonTTY: options.transcriptWhenNonTTY,
    });
    assertPlayableSize(film, plan);
    const clock = options.clock ?? new RealClock();
    const input = options.input ?? new InputController();
    const scenes = options.scene
        ? [mustGetScene(film, options.scene)]
        : film.scenes;
    const scenesPlayed: string[] = [];

    await options.renderer.begin?.(terminal);

    try {
        for (const scene of scenes) {
            const screen = new Screen(terminal.columns, terminal.rows);
            const interruptHandlers = [...film.interruptHandlers];
            const filmPrefersReducedMotion =
                film.options.reducedMotion !== undefined && film.options.reducedMotion !== false;
            const context = new SceneContextImpl(
                film,
                scene.name,
                screen,
                options.renderer,
                clock,
                terminal,
                input,
                interruptHandlers,
                {
                    color: options.color,
                    unicode: options.unicode,
                    reducedMotion:
                        plan.mode === 'transcript' || (options.reducedMotion ?? filmPrefersReducedMotion),
                    skip: plan.mode === 'transcript' || options.skip,
                    speed: options.speed,
                },
            );

            const offCtrlC = input.onCtrlC('soft', async () => {
                await context.runInterruptHandlers();
            });

            try {
                await scene.run(context);
                scenesPlayed.push(scene.name);
            } catch (error) {
                if (error instanceof SceneControlError && error.action === 'skip-scene') {
                    scenesPlayed.push(scene.name);
                    continue;
                }

                if (error instanceof SceneControlError && error.action === 'quit') {
                    break;
                }

                throw error;
            } finally {
                offCtrlC();
            }
        }
    } finally {
        input.clear();
        await options.renderer.end?.();
    }

    return {
        elapsed: clock.now(),
        scenesPlayed,
        mode: plan.mode,
        terminal,
        tooSmall: plan.tooSmall,
        fallbackReason: plan.fallbackReason,
    };
}

function mustGetScene(film: FeaturetteFilm, name: string): NonNullable<ReturnType<FeaturetteFilm['getScene']>> {
    const scene = film.getScene(name);

    if (!scene) {
        throw new Error(`Scene "${name}" was not found in "${film.options.title}".`);
    }

    return scene;
}
