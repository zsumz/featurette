import { RealClock } from '../clock.js';
import {
    isInterruptControl,
    SceneContextImpl,
    SceneControlError,
} from '../context.js';
import type { FeaturetteFilm } from '../film.js';
import { InputController } from '../input.js';
import { InputScope } from '../input/input-scope.js';
import { Screen } from '../screen.js';
import { runWithRuntimeCleanup } from './cleanup.js';
import { assertPlayableSize, planPlayback } from './playback-plan.js';
import { RuntimePlaybackState } from './playback-state.js';
import { RuntimeResizeState } from './resize.js';
import { resolveTerminalInfo } from './terminal-info.js';
import type {
    PlaybackTermination,
    RunFilmOptions,
    RunFilmResult,
} from './types.js';

export async function runFilm(
    film: FeaturetteFilm,
    options: RunFilmOptions,
): Promise<RunFilmResult> {
    const initialTerminal = resolveTerminalInfo(film.options.minSize, options.terminal);
    const plan = planPlayback(film, initialTerminal, {
        transcript: options.transcript,
        transcriptWhenNonTTY: options.transcriptWhenNonTTY,
    });
    assertPlayableSize(film, plan);
    const scenes = options.scene
        ? [mustGetScene(film, options.scene)]
        : film.scenes;
    const playback = new RuntimePlaybackState(plan, options.renderer, options.onModeChange);
    const resize = new RuntimeResizeState(initialTerminal, options.resizeSource, {
        minimum: film.options.minSize,
        mode: film.options.resize,
        playback,
        tooSmall: film.options.tooSmall,
    });
    const clock = options.clock ?? new RealClock();
    const input = options.input ?? new InputController();
    const scenesPlayed: string[] = [];
    let termination: PlaybackTermination = 'completed';

    return runWithRuntimeCleanup(async () => {
        await options.renderer.begin?.(resize.terminal);
        await playback.begin(resize.terminal);

        for (const scene of scenes) {
            const screenSize = resize.screenSize;
            const screen = new Screen(screenSize.columns, screenSize.rows);
            const interruptHandlers = [...film.interruptHandlers];
            const sceneInput = new InputScope(input);
            const filmPrefersReducedMotion =
                film.options.reducedMotion !== undefined && film.options.reducedMotion !== false;
            try {
                const context = new SceneContextImpl(
                    film,
                    scene.name,
                    screen,
                    options.renderer,
                    clock,
                    resize.terminal,
                    sceneInput,
                    interruptHandlers,
                    {
                        color: options.color,
                        unicode: options.unicode,
                        get reducedMotion() {
                            return playback.mode === 'transcript' ||
                                (options.reducedMotion ?? filmPrefersReducedMotion);
                        },
                        get skip() {
                            return playback.mode === 'transcript' || options.skip;
                        },
                        speed: options.speed,
                        resize,
                    },
                );

                sceneInput.onCtrlC('soft', async () => {
                    await context.handleInterrupt();
                });
                await context.run(scene.run);
                scenesPlayed.push(scene.name);
            } catch (error) {
                if (error instanceof SceneControlError && error.action === 'skip-scene') {
                    scenesPlayed.push(scene.name);
                    continue;
                }

                if (error instanceof SceneControlError && error.action === 'quit') {
                    termination = isInterruptControl(error) ? 'interrupted' : 'quit';
                    break;
                }

                throw error;
            } finally {
                sceneInput.dispose();
            }
        }
        return {
            elapsed: clock.now(),
            scenesPlayed,
            termination,
            mode: playback.mode,
            terminal: resize.terminal,
            tooSmall: playback.tooSmall,
            fallbackReason: playback.fallbackReason,
        };
    }, [
        () => {
            resize.dispose();
        },
        async () => {
            await options.renderer.end?.();
        },
    ]);
}

function mustGetScene(film: FeaturetteFilm, name: string): NonNullable<ReturnType<FeaturetteFilm['getScene']>> {
    const scene = film.getScene(name);

    if (!scene) {
        throw new Error(`Scene "${name}" was not found in "${film.options.title}".`);
    }

    return scene;
}
