import type { RunFilmResult } from '../core/runtime.js';

export function applyCliExitCode(result: RunFilmResult): void {
    if (result.termination === 'interrupted') {
        process.exitCode = 130;
    }
}
