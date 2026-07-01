import type { Clock } from '../clock.js';
import type { Layer, Screen, ScreenComposeOptions } from '../screen.js';
import type { LayerOptions, TranscriptEntry, Voice } from '../types.js';
import type { SceneRuntimeOptions, TypeOptions } from './types.js';

export interface EffectsHost {
    readonly clock: Clock;
    readonly options: SceneRuntimeOptions;
    readonly sceneName: string;
    readonly screen: Screen;

    effectFrameCount(duration: number): number;
    layer(name: string, options?: LayerOptions): Layer;
    random(seed?: number): number;
    recordTranscript(entry: TranscriptEntry): Promise<void>;
    render(options?: ScreenComposeOptions): Promise<void>;
    resolveVoice(name?: string): Voice;
    type(text: string, options?: TypeOptions): Promise<void>;
    wait(ms?: number): Promise<void>;
}
