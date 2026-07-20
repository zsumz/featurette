type Cleanup = () => void | Promise<void>;

export async function runWithRuntimeCleanup<T>(
    operation: () => Promise<T>,
    cleanups: Cleanup[],
): Promise<T> {
    let result: T;

    try {
        result = await operation();
    } catch (error) {
        try {
            await runCleanupSteps(cleanups);
        } catch (cleanupError) {
            throw new AggregateError(
                [error, cleanupError],
                'Film playback and cleanup both failed.',
                { cause: cleanupError },
            );
        }

        throw error;
    }

    await runCleanupSteps(cleanups);
    return result;
}

async function runCleanupSteps(cleanups: Cleanup[]): Promise<void> {
    const errors: unknown[] = [];

    for (const cleanup of cleanups) {
        try {
            await cleanup();
        } catch (error) {
            errors.push(error);
        }
    }

    if (errors.length === 1) {
        throw errors[0];
    }

    if (errors.length > 1) {
        throw new AggregateError(errors, 'Film cleanup failed.');
    }
}
