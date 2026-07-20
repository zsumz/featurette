import { resolvePosition } from '../position.js';
import type { EffectsHost } from './effects-host.js';
import type {
    MotionEasing,
    MotionFrame,
    MotionPoint,
    MotionTimelineOptions,
} from './effects-types.js';

export async function runTimeline(
    host: EffectsHost,
    options: MotionTimelineOptions,
    draw: (frame: MotionFrame) => void | Promise<void>,
): Promise<void> {
    const duration = options.duration ?? 600;
    const frames = host.options.reducedMotion
        ? 1
        : Math.max(1, Math.round(options.frames ?? host.effectFrameCount(duration)));
    const layer = options.layer ? host.layer(options.layer) : undefined;
    const clearLayer = options.clear ?? layer !== undefined;
    const easing = resolveEasing(options.easing);

    for (let frame = 0; frame < frames; frame += 1) {
        const progress = frames === 1 ? 1 : frame / (frames - 1);
        const motionFrame: MotionFrame = {
            frame,
            frames,
            elapsed: progress * duration,
            progress,
            eased: easing(progress),
            layer,
        };

        if (clearLayer) {
            layer?.clear();
        }

        await draw(motionFrame);
        await host.render();
        await host.wait(host.options.reducedMotion ? 0 : frameWait(duration, frames, frame));
    }
}

export function resolveMotionPoint(
    host: EffectsHost,
    point: MotionPoint,
    subject: { columns?: number; rows?: number } = {},
): { x: number; y: number } {
    return resolvePosition(point, host.screen.size, subject.columns ?? 1, subject.rows ?? 1);
}

export function interpolatePoint(
    from: { x: number; y: number },
    to: { x: number; y: number },
    progress: number,
): { x: number; y: number } {
    return {
        x: Math.round(from.x + (to.x - from.x) * progress),
        y: Math.round(from.y + (to.y - from.y) * progress),
    };
}

function frameWait(duration: number, frames: number, frame: number): number {
    const start = Math.round(duration * frame / frames);
    const end = Math.round(duration * (frame + 1) / frames);

    return Math.max(0, end - start);
}

function resolveEasing(easing: MotionEasing = 'linear'): (progress: number) => number {
    if (typeof easing === 'function') {
        return (progress) => clamp01(easing(clamp01(progress)));
    }

    if (easing === 'ease-in') {
        return (progress) => clamp01(progress) ** 2;
    }

    if (easing === 'ease-out') {
        return (progress) => 1 - (1 - clamp01(progress)) ** 2;
    }

    if (easing === 'ease-in-out') {
        return (progress) => {
            const clamped = clamp01(progress);

            if (clamped < 0.5) {
                return 2 * clamped ** 2;
            }

            return 1 - (-2 * clamped + 2) ** 2 / 2;
        };
    }

    return clamp01;
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(1, Math.max(0, value));
}
