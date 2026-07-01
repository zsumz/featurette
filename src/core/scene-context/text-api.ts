import type { Clock } from '../clock.js';
import { charactersOf } from '../graphemes.js';
import type { Layer, Screen, ScreenComposeOptions } from '../screen.js';
import { mergeStyle } from '../style.js';
import type { TranscriptEntry, Voice } from '../types.js';
import type { FadeOptions, SayOptions, SceneRuntimeOptions, TypeOptions } from './types.js';
import { SceneTextCursor } from './text-cursor.js';
import { distort } from './text.js';

export interface SceneTextHost {
    clock: Clock;
    options: SceneRuntimeOptions;
    sceneName: string;
    screen: Screen;
    effectFrameCount(duration: number): number;
    fadeIn(duration?: number, draw?: () => void | Promise<void>, options?: FadeOptions): Promise<void>;
    layer(name: string): Layer;
    random(seed?: number): number;
    recordTranscript(entry: TranscriptEntry): Promise<void>;
    render(options?: ScreenComposeOptions): Promise<void>;
    resolveVoice(name?: string): Voice;
    wait(ms?: number): Promise<void>;
}

export class SceneTextApi {
    private readonly cursor = new SceneTextCursor();

    constructor(private readonly host: SceneTextHost) {}

    public resetCursor(): void {
        this.cursor.reset();
    }

    public async type(text: string, options: TypeOptions = {}): Promise<void> {
        const voice = this.host.resolveVoice(options.voice);
        const style = mergeStyle(voice, options);
        const speed = options.speed ?? voice.speed ?? 35;
        const cursor = options.cursor ?? voice.cursor;
        const layer = this.host.layer(options.layer ?? 'main');
        const origin = this.cursor.resolve(text, options.at, this.host.screen);
        const transcript = options.transcript ?? true;
        const shouldAnimate = speed > 0 && !this.host.options.skip;
        const characters = charactersOf(text);

        if (!shouldAnimate || this.host.options.reducedMotion) {
            layer.text(origin.x, origin.y, text, style);
            await this.host.render();
        } else {
            let partial = '';

            for (const char of characters) {
                partial += char;
                layer.text(origin.x, origin.y, cursor ? `${partial}${cursor}` : partial, style);
                await this.host.render();
                await this.host.wait(speed);
            }

            layer.text(origin.x, origin.y, text, style);
            await this.host.render();
        }

        this.cursor.advance(origin, text, options.advance ?? 'cursor', this.host.screen);

        if (transcript && text.trim().length > 0) {
            await this.host.recordTranscript({
                elapsed: this.host.clock.now(),
                scene: this.host.sceneName,
                voice: options.voice,
                text,
            });
        }
    }

    public async say(voice: string, text: string, options: SayOptions = {}): Promise<void> {
        const voiceOptions = this.host.resolveVoice(options.voice ?? voice);
        const prefix = voiceOptions.prefix ?? '';

        await this.type(`${prefix}${text}`, {
            ...options,
            voice: options.voice ?? voice,
            advance: options.advance ?? 'line',
        });
    }

    public async backspace(count: number, options: TypeOptions = {}): Promise<void> {
        const layer = this.host.layer(options.layer ?? 'main');
        const style = mergeStyle(this.host.resolveVoice(options.voice), options);
        const at = this.cursor.resolve('', options.at, this.host.screen);
        const spaces = ' '.repeat(Math.max(0, count));
        layer.text(at.x - count, at.y, spaces, style);
        await this.host.render();
        this.cursor.moveTo({ x: Math.max(0, at.x - count), y: at.y });
    }

    public async replace(_from: string, to: string, options: TypeOptions = {}): Promise<void> {
        await this.type(to, options);
    }

    public async reveal(
        text: string,
        options: TypeOptions & { mode?: 'type' | 'fade'; duration?: number } = {},
    ): Promise<void> {
        if (options.mode === 'fade') {
            await this.host.fadeIn(options.duration ?? 500, () => {
                const layer = this.host.layer(options.layer ?? 'main');
                const origin = this.cursor.resolve(text, options.at, this.host.screen);
                layer.text(origin.x, origin.y, text, mergeStyle(this.host.resolveVoice(options.voice), options));
            });
            await this.host.recordTranscript({
                elapsed: this.host.clock.now(),
                scene: this.host.sceneName,
                voice: options.voice,
                text,
            });
            return;
        }

        await this.type(text, options);
    }

    public async redact(text: string, options: TypeOptions = {}): Promise<void> {
        const redacted = text.replace(/[^\s]/g, '#');
        await this.type(redacted, { ...options, transcript: false });
        await this.host.recordTranscript({
            elapsed: this.host.clock.now(),
            scene: this.host.sceneName,
            voice: options.voice,
            text,
        });
    }

    public async glitchText(
        text: string,
        options: TypeOptions & { duration?: number; intensity?: number } = {},
    ): Promise<void> {
        const layer = this.host.layer(options.layer ?? 'main');
        const origin = this.cursor.resolve(text, options.at, this.host.screen);
        const style = mergeStyle(this.host.resolveVoice(options.voice), options);
        const duration = options.duration ?? 600;
        const intensity = options.intensity ?? 0.25;
        const frames = this.host.effectFrameCount(duration);

        for (let frame = 0; frame < frames; frame += 1) {
            layer.text(origin.x, origin.y, distort(text, intensity, () => this.host.random()), style);
            await this.host.render();
            await this.host.wait(duration / frames);
        }

        layer.text(origin.x, origin.y, text, style);
        await this.host.render();
        await this.host.recordTranscript({
            elapsed: this.host.clock.now(),
            scene: this.host.sceneName,
            voice: options.voice,
            text,
        });
    }
}
