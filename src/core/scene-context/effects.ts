import { createDeveloperEffects } from './developer-effects.js';
import { createDirectorEffects } from './director-effects.js';
import { createMotionEffects } from './motion-effects.js';
import { createTextEffects } from './text-effects.js';
import type { EffectsAPI } from './types.js';
import type { EffectsHost } from './effects-host.js';

export function createEffectsApi(host: EffectsHost): EffectsAPI {
    return {
        ...createDirectorEffects(host),
        ...createMotionEffects(host),
        ...createDeveloperEffects(host),
        ...createTextEffects(host),
    };
}
