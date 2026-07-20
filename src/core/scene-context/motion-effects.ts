import type { EffectsAPI } from './types.js';
import type { EffectsHost } from './effects-host.js';
import { interpolatePoint, resolveMotionPoint, runTimeline } from './motion-timeline.js';

export function createMotionEffects(
    host: EffectsHost,
): Pick<
    EffectsAPI,
    'fadeIn' | 'fadeOut' | 'glitch' | 'keyframes' | 'moveAlong' | 'screenShake' | 'starfield' | 'tween'
> {
    return {
        keyframes: async (options) => {
            await runTimeline(host, options, async (frame) => {
                await options.draw(frame);
            });
        },
        tween: async (options) => {
            const from = resolveMotionPoint(host, options.from, options.subject);
            const to = resolveMotionPoint(host, options.to, options.subject);

            await runTimeline(host, options, async (frame) => {
                await options.draw({
                    ...frame,
                    point: interpolatePoint(from, to, frame.eased),
                    segment: 0,
                });
            });
        },
        moveAlong: async (options) => {
            const path = options.path.map((point) => resolveMotionPoint(host, point, options.subject));
            const segments = path.length - 1;

            await runTimeline(host, options, async (frame) => {
                const position = frame.eased * segments;
                const segment = Math.min(segments - 1, Math.floor(position));
                const segmentProgress = segments === 0 ? 1 : position - segment;
                const from = path[segment] ?? path[0];
                const to = path[segment + 1] ?? from;

                await options.draw({
                    ...frame,
                    point: interpolatePoint(from, to, segmentProgress),
                    segment,
                });
            });
        },
        fadeIn: async (duration = 500, draw) => {
            if (draw) {
                await draw();
            }

            await host.render();
            await host.wait(host.options.reducedMotion ? 0 : duration);
        },
        fadeOut: async (duration = 500, options = {}) => {
            await host.wait(host.options.reducedMotion ? 0 : duration);
            host.screen.clear(options.layer);
            await host.render();
        },
        starfield: async (options = {}) => {
            const layer = host.layer(options.layer ?? 'stars', { zIndex: -10 });
            const density = options.density ?? 0.04;
            const count = Math.max(1, Math.round(host.screen.columns * host.screen.rows * density));
            const colors = options.colors ?? ['system', 'memory', 'white'];
            const marks = options.twinkle ? ['.', '*', '+'] : ['.'];
            let seeded = false;
            const random = (): number => {
                if (options.seed === undefined || seeded) {
                    return host.random();
                }

                seeded = true;
                return host.random(options.seed);
            };

            for (let index = 0; index < count; index += 1) {
                const x = Math.floor(random() * host.screen.columns);
                const y = Math.floor(random() * host.screen.rows);
                const mark = marks[Math.floor(random() * marks.length)] ?? '.';
                const fg = colors[Math.floor(random() * colors.length)];
                layer.text(x, y, mark, { fg, dim: mark === '.' });
            }

            await host.render();
            await host.wait(host.options.reducedMotion ? 0 : options.duration ?? 1200);
        },
        glitch: async (options = {}) => {
            const layer = host.layer(options.layer ?? 'glitch', { zIndex: 100 });
            const duration = options.duration ?? 450;
            const frames = host.effectFrameCount(duration);
            const intensity = options.intensity ?? 0.2;

            if (host.options.reducedMotion) {
                return;
            }

            for (let frame = 0; frame < frames; frame += 1) {
                layer.clear();
                const noise = Math.round(host.screen.columns * intensity);

                for (let index = 0; index < noise; index += 1) {
                    layer.text(
                        Math.floor(host.random() * host.screen.columns),
                        Math.floor(host.random() * host.screen.rows),
                        host.random() > 0.5 ? '#' : '%',
                        { fg: 'panic', dim: true },
                    );
                }

                await host.render();
                await host.wait(duration / frames);
            }

            layer.clear();
            await host.render();
        },
        screenShake: async (options = {}) => {
            const duration = options.duration ?? 200;
            const intensity = Math.max(0, Math.round(options.intensity ?? 1));

            if (host.options.reducedMotion || intensity === 0) {
                await host.wait(host.options.reducedMotion ? 0 : duration);
                return;
            }

            const frames = host.effectFrameCount(duration);

            for (let frame = 0; frame < frames; frame += 1) {
                await host.render({ offset: shakeOffset(host, frame, intensity) });
                await host.wait(duration / frames);
            }

            await host.render();
        },
    };
}

function shakeOffset(
    host: EffectsHost,
    frame: number,
    intensity: number,
): { x: number; y: number } {
    const x = randomOffset(host, intensity);
    const y = randomOffset(host, intensity);

    if (x !== 0 || y !== 0) {
        return { x, y };
    }

    return { x: frame % 2 === 0 ? intensity : -intensity, y: 0 };
}

function randomOffset(host: EffectsHost, intensity: number): number {
    return Math.round((host.random() * 2 - 1) * intensity);
}
