import type { SceneContext } from './context.js';
import type { FilmOptions } from './types.js';

export type Scene = (context: SceneContext) => void | Promise<void>;
export type InterruptHandler = (context: SceneContext) => void | Promise<void>;

export interface SceneRecord {
    name: string;
    run: Scene;
}

export class FeaturetteFilm {
    public readonly scenes: SceneRecord[] = [];
    public readonly interruptHandlers: InterruptHandler[] = [];

    constructor(public readonly options: FilmOptions) {}

    public scene(name: string, run: Scene): this {
        const existing = this.scenes.findIndex((scene) => scene.name === name);

        if (existing >= 0) {
            this.scenes.splice(existing, 1, { name, run });
        } else {
            this.scenes.push({ name, run });
        }

        return this;
    }

    public onInterrupt(handler: InterruptHandler): this {
        this.interruptHandlers.push(handler);
        return this;
    }

    public getScene(name: string): SceneRecord | undefined {
        return this.scenes.find((scene) => scene.name === name);
    }
}

export type Film = FeaturetteFilm;

export function defineFilm(options: FilmOptions): FeaturetteFilm {
    return new FeaturetteFilm(options);
}
