import type { Clock } from '../clock.js';
import type { FeaturetteFilm, InterruptHandler } from '../film.js';
import type { InputController } from '../input.js';
import type { Point } from '../position.js';
import { center } from '../position.js';
import type { Renderer } from '../renderer.js';
import type { Layer, Screen } from '../screen.js';
import type { TerminalInfo } from '../types.js';
import type {
    ClearOptions,
    DrawAPI,
    EffectsAPI,
    FadeOptions,
    InputAPI,
    SayOptions,
    SceneContext,
    SceneRuntimeOptions,
    SceneTask,
    TypeOptions,
} from './types.js';
import { SceneControlError } from './control.js';
import { createDrawApi as createSceneDrawApi } from './draw-api.js';
import { createEffectsApi as createSceneEffectsApi } from './effects.js';
import { SceneRuntimeHost } from './scene-runtime-host.js';
import { SceneTextApi } from './text-api.js';

export class SceneContextImpl implements SceneContext {
    public readonly draw: DrawAPI;
    public readonly effects: EffectsAPI;
    public readonly input: InputAPI;
    private readonly host: SceneRuntimeHost;
    private readonly textApi: SceneTextApi;

    constructor(
        public readonly film: FeaturetteFilm,
        public readonly sceneName: string,
        public readonly screen: Screen,
        private readonly renderer: Renderer,
        private readonly clock: Clock,
        public readonly terminal: TerminalInfo,
        private readonly inputController: InputController,
        private readonly interruptHandlers: InterruptHandler[],
        private readonly options: SceneRuntimeOptions = {},
    ) {
        this.host = new SceneRuntimeHost({
            film,
            sceneName,
            screen,
            renderer,
            clock,
            terminal,
            runtime: options,
            callbacks: {
                fadeIn: async (duration, draw, fadeOptions) => this.fadeIn(duration, draw, fadeOptions),
                type: async (text, typeOptions) => this.type(text, typeOptions),
                wait: async (ms) => this.wait(ms),
            },
        });
        this.draw = this.createDrawApi();
        this.effects = this.createEffectsApi();
        this.textApi = this.createTextApi();
        this.input = {
            onKey: (name, handler) => this.inputController.onKey(name, handler),
            onCtrlC: (mode, handler) => this.inputController.onCtrlC(mode, handler),
        };
    }

    public layer(name: string, options?: { zIndex?: number; hidden?: boolean }): Layer {
        return this.screen.layer(name, options);
    }

    public async clear(options: ClearOptions = {}): Promise<void> {
        this.screen.clear(options.layer);
        this.textApi.resetCursor();
        await this.render();
    }

    public async beat(ms = 600): Promise<void> {
        await this.wait(ms);
    }

    public async wait(ms = 0): Promise<void> {
        if (this.options.skip) {
            return;
        }

        const speed = this.options.speed && this.options.speed > 0 ? this.options.speed : 1;
        await this.clock.wait(ms / speed);
    }

    public async cut(): Promise<void> {
        await this.render();
    }

    public async type(text: string, options: TypeOptions = {}): Promise<void> {
        await this.textApi.type(text, options);
    }

    public async say(voice: string, text: string, options: SayOptions = {}): Promise<void> {
        await this.textApi.say(voice, text, options);
    }

    public async backspace(count: number, options: TypeOptions = {}): Promise<void> {
        await this.textApi.backspace(count, options);
    }

    public async replace(_from: string, to: string, options: TypeOptions = {}): Promise<void> {
        await this.textApi.replace(_from, to, options);
    }

    public async reveal(
        text: string,
        options: TypeOptions & { mode?: 'type' | 'fade'; duration?: number } = {},
    ): Promise<void> {
        await this.textApi.reveal(text, options);
    }

    public async redact(text: string, options: TypeOptions = {}): Promise<void> {
        await this.textApi.redact(text, options);
    }

    public async glitchText(
        text: string,
        options: TypeOptions & { duration?: number; intensity?: number } = {},
    ): Promise<void> {
        await this.textApi.glitchText(text, options);
    }

    public async fadeIn(
        duration?: number,
        draw?: () => void | Promise<void>,
        options?: FadeOptions,
    ): Promise<void> {
        await this.effects.fadeIn(duration, draw, options);
    }

    public async fadeOut(duration?: number, options?: FadeOptions): Promise<void> {
        await this.effects.fadeOut(duration, options);
    }

    public async parallel(tasks: SceneTask[]): Promise<void> {
        await Promise.all(tasks.map(async (task) => task()));
    }

    public async sequence(tasks: SceneTask[]): Promise<void> {
        for (const task of tasks) {
            await task();
        }
    }

    public async race<T>(tasks: Array<() => T | Promise<T>>): Promise<T> {
        return Promise.race(tasks.map(async (task) => task()));
    }

    public center(): Point {
        return center();
    }

    public onInterrupt(handler: InterruptHandler): void {
        this.interruptHandlers.push(handler);
    }

    public skipScene(): never {
        throw new SceneControlError('skip-scene');
    }

    public quit(): never {
        throw new SceneControlError('quit');
    }

    public exit(): never {
        throw new SceneControlError('quit');
    }

    public async runInterruptHandlers(): Promise<void> {
        for (const handler of this.interruptHandlers) {
            await handler(this);
        }
    }

    private createDrawApi(): DrawAPI {
        return createSceneDrawApi({
            layer: (name) => this.layer(name),
        });
    }

    private createEffectsApi(): EffectsAPI {
        return createSceneEffectsApi(this.host);
    }

    private createTextApi(): SceneTextApi {
        return new SceneTextApi(this.host);
    }

    private async render(): Promise<void> {
        await this.host.render();
    }
}
