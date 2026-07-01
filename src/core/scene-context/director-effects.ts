import { center, resolvePosition, stringCellWidth } from '../position.js';
import { mergeStyle } from '../style.js';
import type { EffectsAPI } from './types.js';
import type { EffectsHost } from './effects-host.js';

export function createDirectorEffects(
    host: EffectsHost,
): Pick<EffectsAPI, 'countdown' | 'scanlines' | 'titleCard'> {
    return {
        titleCard: async (options) => {
            const layer = host.layer(options.layer ?? 'title', { zIndex: 50 });
            const voice = host.resolveVoice(options.voice);
            const lines = options.subtitle ? [options.title, options.subtitle] : [options.title];
            const width = Math.max(0, ...lines.map((line) => stringCellWidth(line)));
            const origin = resolvePosition(options.at ?? center(), host.screen.size, width, lines.length);

            layer.clear();
            layer.text(origin.x, origin.y, options.title, mergeStyle(voice, options.titleStyle, { bold: true }));

            if (options.subtitle) {
                layer.text(
                    origin.x,
                    origin.y + 1,
                    options.subtitle,
                    mergeStyle(voice, { dim: true }, options.subtitleStyle),
                );
            }

            await host.render();
            await host.recordTranscript({
                elapsed: host.clock.now(),
                scene: host.sceneName,
                voice: options.voice,
                text: lines.join('\n'),
            });
            await host.wait(host.options.reducedMotion ? 0 : options.duration ?? 1200);
        },
        scanlines: async (options = {}) => {
            const layer = host.layer(options.layer ?? 'scanlines', { zIndex: 90 });
            const spacing = Math.max(1, options.spacing ?? 2);
            const char = options.char ?? '-';
            const style = mergeStyle({ fg: 'system', dim: true }, options);

            layer.clear();

            for (let y = 0; y < host.screen.rows; y += spacing) {
                layer.text(0, y, char.repeat(host.screen.columns), style);
            }

            await host.render();
            await host.wait(host.options.reducedMotion ? 0 : options.duration ?? 500);
        },
        countdown: async (options = {}) => {
            const layer = host.layer(options.layer ?? 'countdown', { zIndex: 60 });
            const from = options.from ?? 3;
            const to = options.to ?? 1;
            const step = from >= to ? -1 : 1;
            const style = mergeStyle(host.resolveVoice(options.voice), options, { bold: true });

            for (let value = from; step < 0 ? value >= to : value <= to; value += step) {
                const text = String(value);
                const origin = resolvePosition(options.at ?? center(), host.screen.size, stringCellWidth(text));
                layer.clear();
                layer.text(origin.x, origin.y, text, style);
                await host.render();
                await host.recordTranscript({
                    elapsed: host.clock.now(),
                    scene: host.sceneName,
                    voice: options.voice,
                    text,
                });
                await host.wait(host.options.reducedMotion ? 0 : options.interval ?? 500);
            }

            if (options.finalText) {
                const origin = resolvePosition(
                    options.at ?? center(),
                    host.screen.size,
                    stringCellWidth(options.finalText),
                );
                layer.clear();
                layer.text(origin.x, origin.y, options.finalText, style);
                await host.render();
                await host.recordTranscript({
                    elapsed: host.clock.now(),
                    scene: host.sceneName,
                    voice: options.voice,
                    text: options.finalText,
                });
            }
        },
    };
}
