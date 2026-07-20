import type { Clock } from '../clock.js';
import type { FeaturetteFilm } from '../film.js';
import type { Renderer } from '../renderer.js';
import type { RuntimeResizeState } from '../runtime/resize.js';
import type { Layer, Screen, ScreenComposeOptions } from '../screen.js';
import type { LayerOptions, TerminalInfo, TranscriptEntry, Voice } from '../types.js';
import type { EffectsHost } from './effects-host.js';
import type { FadeOptions, SceneRuntimeOptions, TypeOptions } from './types.js';
import type { SceneTextHost } from './text-api.js';

interface SceneRuntimeCallbacks {
    fadeIn(duration?: number, draw?: () => void | Promise<void>, options?: FadeOptions): Promise<void>;
    type(text: string, options?: TypeOptions): Promise<void>;
    wait(ms?: number): Promise<void>;
}

interface SceneRuntimeHostOptions {
    film: FeaturetteFilm;
    sceneName: string;
    screen: Screen;
    renderer: Renderer;
    clock: Clock;
    terminal: TerminalInfo;
    runtime: SceneRuntimeOptions;
    resize?: RuntimeResizeState;
    callbacks: SceneRuntimeCallbacks;
}

export class SceneRuntimeHost implements EffectsHost, SceneTextHost {
    private seed = 0x5eed;

    constructor(private readonly host: SceneRuntimeHostOptions) {}

    public get clock(): Clock {
        return this.host.clock;
    }

    public get options(): SceneRuntimeOptions {
        return this.host.runtime;
    }

    public get sceneName(): string {
        return this.host.sceneName;
    }

    public get screen(): Screen {
        return this.host.screen;
    }

    public get terminal(): TerminalInfo {
        return this.host.terminal;
    }

    public layer(name: string, options?: LayerOptions): Layer {
        return this.host.screen.layer(name, options);
    }

    public async fadeIn(
        duration?: number,
        draw?: () => void | Promise<void>,
        options?: FadeOptions,
    ): Promise<void> {
        await this.host.callbacks.fadeIn(duration, draw, options);
    }

    public async type(text: string, options?: TypeOptions): Promise<void> {
        await this.host.callbacks.type(text, options);
    }

    public async wait(ms = 0): Promise<void> {
        await this.host.callbacks.wait(ms);
    }

    public async render(options?: ScreenComposeOptions): Promise<void> {
        const frame = this.host.screen.compose(this.host.clock.now(), options);
        await this.host.renderer.render(this.host.resize?.fit(frame) ?? frame, {
            color: this.host.runtime.color,
            palette: this.host.film.options.palette,
            unicode: this.host.runtime.unicode,
        });
    }

    public async recordTranscript(entry: TranscriptEntry): Promise<void> {
        await this.host.renderer.transcript?.(entry);
    }

    public resolveVoice(name?: string): Voice {
        if (!name) {
            return {};
        }

        return this.host.film.options.voices?.[name] ?? { fg: name };
    }

    public effectFrameCount(duration: number): number {
        if (this.host.runtime.reducedMotion || this.host.runtime.skip) {
            return 1;
        }

        const fps = this.host.film.options.fps ?? 24;
        return Math.max(1, Math.round(duration / 1000 * fps));
    }

    public random(seed?: number): number {
        if (seed !== undefined) {
            this.seed = seed;
        }

        this.seed = 1664525 * this.seed + 1013904223 >>> 0;
        return this.seed / 0x100000000;
    }
}
