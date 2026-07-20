export function runCleanupSteps(steps: Array<() => void>): void {
    const errors: unknown[] = [];

    for (const step of steps) {
        try {
            step();
        } catch (error) {
            errors.push(error);
        }
    }

    if (errors.length === 1) {
        throw errors[0];
    }

    if (errors.length > 1) {
        throw new AggregateError(errors, 'Terminal session cleanup failed.');
    }
}
