import { FakeClock } from '../core/clock.js';
import { runFilm, type RunFilmResult } from '../core/runtime.js';
import type { FeaturetteFilm } from '../core/film.js';
import type { TerminalInfo, TerminalSize, TranscriptEntry } from '../core/types.js';
import { StringRenderer } from '../renderers/string.js';

export interface RenderSceneOptions {
    terminal?: Partial<TerminalInfo> | TerminalSize;
    color?: boolean;
    unicode?: boolean;
    reducedMotion?: boolean;
    skip?: boolean;
    speed?: number;
}

export interface RenderSceneResult {
    frames: string[];
    frameRecords: Array<{ elapsed: number; text: string }>;
    lastFrame: string;
    transcript: string;
    entries: TranscriptEntry[];
    elapsed: number;
    result: RunFilmResult;
    renderer: StringRenderer;
}

export async function renderScene(
    film: FeaturetteFilm,
    scene: string,
    options: RenderSceneOptions = {},
): Promise<RenderSceneResult> {
    const renderer = new StringRenderer();
    const clock = new FakeClock();
    const result = await runFilm(film, {
        renderer,
        clock,
        scene,
        terminal: options.terminal,
        color: options.color ?? false,
        unicode: options.unicode ?? true,
        reducedMotion: options.reducedMotion ?? true,
        skip: options.skip,
        speed: options.speed,
    });

    return toRenderSceneResult(renderer, result, clock.now());
}

export async function renderFilm(
    film: FeaturetteFilm,
    options: RenderSceneOptions = {},
): Promise<RenderSceneResult> {
    const renderer = new StringRenderer();
    const clock = new FakeClock();
    const result = await runFilm(film, {
        renderer,
        clock,
        terminal: options.terminal,
        color: options.color ?? false,
        unicode: options.unicode ?? true,
        reducedMotion: options.reducedMotion ?? true,
        skip: options.skip,
        speed: options.speed,
    });

    return toRenderSceneResult(renderer, result, clock.now());
}

export async function renderAt(
    film: FeaturetteFilm,
    options: RenderSceneOptions & { scene: string; time: number },
): Promise<{ elapsed: number; toString(): string }> {
    const rendered = await renderScene(film, options.scene, options);
    const frame =
        rendered.frameRecords.find((candidate) => candidate.elapsed >= options.time) ??
    rendered.frameRecords.at(-1) ??
    { elapsed: 0, text: '' };

    return {
        elapsed: frame.elapsed,
        toString: () => frame.text,
    };
}

function toRenderSceneResult(
    renderer: StringRenderer,
    result: RunFilmResult,
    elapsed: number,
): RenderSceneResult {
    return {
        frames: renderer.frames,
        frameRecords: renderer.frameRecords,
        lastFrame: renderer.lastFrame(),
        transcript: renderer.transcriptText(),
        entries: renderer.entries,
        elapsed,
        result,
        renderer,
    };
}
