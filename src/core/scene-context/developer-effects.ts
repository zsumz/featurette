import { resolvePosition, stringCellWidth } from '../position.js';
import { mergeStyle } from '../style.js';
import type { EffectsAPI } from './types.js';
import type { EffectsHost } from './effects-host.js';
import { toLines } from './text.js';

export function createDeveloperEffects(
    host: EffectsHost,
): Pick<EffectsAPI, 'logStream' | 'mergeConflict' | 'progress' | 'testRunner'> {
    return {
        logStream: async (options) => {
            const layer = host.layer(options.layer ?? 'main');
            const origin = resolvePosition(options.at, host.screen.size);
            const style = host.resolveVoice(options.voice);

            for (let index = 0; index < options.lines.length; index += 1) {
                layer.text(origin.x, origin.y + index, options.lines[index] ?? '', style);
                await host.render();
                await host.wait(host.options.reducedMotion ? 0 : options.interval ?? 220);
            }

            for (const line of options.lines) {
                await host.recordTranscript({
                    elapsed: host.clock.now(),
                    scene: host.sceneName,
                    voice: options.voice,
                    text: line,
                });
            }
        },
        progress: async (options = {}) => {
            const layer = host.layer(options.layer ?? 'main');
            const origin = resolvePosition(options.at, host.screen.size);
            const style = host.resolveVoice(options.voice);
            const from = options.from ?? 0;
            const to = options.to ?? 1;
            const duration = options.duration ?? 1000;
            const frames = host.effectFrameCount(duration);

            for (let frame = 0; frame <= frames; frame += 1) {
                const amount = from + (to - from) * (frame / frames);
                layer.progressBar(origin.x, origin.y, options.width ?? 24, amount, {
                    ...style,
                    label: options.label,
                    completeChar: options.failAtEnd && frame === frames ? '!' : '#',
                });
                await host.render();
                await host.wait(host.options.reducedMotion ? 0 : duration / frames);
            }

            if (options.label) {
                await host.recordTranscript({
                    elapsed: host.clock.now(),
                    scene: host.sceneName,
                    voice: options.voice,
                    text: options.label,
                });
            }
        },
        testRunner: async (options) => {
            const layer = host.layer(options.layer ?? 'tests', { zIndex: 20 });
            const origin = resolvePosition(options.at, host.screen.size);
            const voice = host.resolveVoice(options.voice);
            const transcript: string[] = [];
            let row = origin.y;
            let passed = 0;
            let failed = 0;
            let skipped = 0;

            if (options.title) {
                layer.text(origin.x, row, options.title, mergeStyle(voice, { bold: true }));
                transcript.push(options.title);
                row += 1;
            }

            for (const line of options.lines) {
                const status = line.status ?? 'pass';
                const marker = status === 'pass' ? 'ok' : status === 'fail' ? 'not ok' : 'skip';
                const detail = line.detail ? ` - ${line.detail}` : '';
                const rendered = `${marker} ${line.name}${detail}`;
                const style =
                    status === 'pass'
                        ? mergeStyle(voice, { fg: 'life' })
                        : status === 'fail'
                            ? mergeStyle(voice, { fg: 'panic', bold: true })
                            : mergeStyle(voice, { fg: 'system', dim: true });

                layer.text(origin.x, row, rendered, style);
                transcript.push(rendered);
                if (status === 'pass') passed += 1;
                else if (status === 'fail') failed += 1;
                else skipped += 1;

                await host.render();
                await host.wait(host.options.reducedMotion ? 0 : options.interval ?? 220);
                row += 1;
            }

            const summary = `${String(passed)} passed, ${String(failed)} failed, ${String(skipped)} skipped`;
            layer.text(
                origin.x,
                row,
                summary,
                mergeStyle(voice, failed > 0 ? { fg: 'panic', bold: true } : { fg: 'life' }),
            );
            transcript.push(summary);
            await host.render();
            await host.recordTranscript({
                elapsed: host.clock.now(),
                scene: host.sceneName,
                voice: options.voice,
                text: transcript.join('\n'),
            });
        },
        mergeConflict: async (options) => {
            const layer = host.layer(options.layer ?? 'conflict', { zIndex: 25 });
            const voice = host.resolveVoice(options.voice);
            const ours = toLines(options.ours);
            const theirs = toLines(options.theirs);
            const conflictLines = [
                `<<<<<<< ${options.oursLabel ?? 'ours'}`,
                ...ours,
                '=======',
                ...theirs,
                `>>>>>>> ${options.theirsLabel ?? 'theirs'}`,
            ];
            const width = Math.max(0, ...conflictLines.map((line) => stringCellWidth(line)));
            const origin = resolvePosition(options.at, host.screen.size, width, conflictLines.length);

            layer.clear();
            conflictLines.forEach((line, index) => {
                const style = line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')
                    ? mergeStyle(voice, { fg: 'panic', bold: true })
                    : index <= ours.length
                        ? mergeStyle(voice, { fg: 'memory' })
                        : mergeStyle(voice, { fg: 'system' });
                layer.text(origin.x, origin.y + index, line, style);
            });
            await host.render();
            await host.recordTranscript({
                elapsed: host.clock.now(),
                scene: host.sceneName,
                voice: options.voice,
                text: conflictLines.join('\n'),
            });
            await host.wait(host.options.reducedMotion ? 0 : options.duration ?? 900);

            if (options.resolved !== undefined) {
                const resolved = toLines(options.resolved);
                layer.clear();
                resolved.forEach((line, index) => {
                    layer.text(origin.x, origin.y + index, line, mergeStyle(voice, { fg: 'life' }));
                });
                await host.render();
                await host.recordTranscript({
                    elapsed: host.clock.now(),
                    scene: host.sceneName,
                    voice: options.voice,
                    text: resolved.join('\n'),
                });
            }
        },
    };
}
