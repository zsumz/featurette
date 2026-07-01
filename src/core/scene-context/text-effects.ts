import type { EffectsAPI } from './types.js';
import type { EffectsHost } from './effects-host.js';

export function createTextEffects(host: EffectsHost): Pick<EffectsAPI, 'wipe'> {
    return {
        wipe: async (text, options = {}) => {
            const speed = options.speed ?? host.resolveVoice(options.voice).speed ?? 25;
            await host.type(text, { ...options, speed });
        },
    };
}
