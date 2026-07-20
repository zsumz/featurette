import type { TerminalSessionOptions } from '../session-types.js';
import { TerminalSession } from './terminal-session.js';

export async function withTerminalSession<T>(
    callback: (session: TerminalSession) => Promise<T> | T,
    options: TerminalSessionOptions = {},
): Promise<T> {
    const session = new TerminalSession(options);

    try {
        const result = await callback(session);
        session.restore();
        return result;
    } catch (error) {
        try {
            session.restore();
        } catch (cleanupError) {
            throw new AggregateError(
                [error, cleanupError],
                'Terminal playback and cleanup both failed.',
                { cause: cleanupError },
            );
        }

        throw error;
    }
}
