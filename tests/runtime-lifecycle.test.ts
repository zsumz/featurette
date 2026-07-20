import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    runFilm,
    StringRenderer,
    type TerminalResizeSource,
} from '../dist/index.js';

test('runFilm validates scene selection before subscribing to resize events', async () => {
    const resize = createTrackedResizeSource();
    const film = defineFilm({ title: 'Missing Scene' });
    film.scene('present', async ($) => $.cut());

    await assert.rejects(
        runFilm(film, {
            renderer: new StringRenderer(),
            resizeSource: resize.source,
            scene: 'missing',
            terminal: { columns: 20, rows: 4 },
        }),
        /Scene "missing" was not found/,
    );

    assert.equal(resize.subscriptions, 0);
    assert.equal(resize.disposals, 0);
});

test('runFilm disposes resize subscriptions when a scene fails', async () => {
    const resize = createTrackedResizeSource();
    const film = defineFilm({ title: 'Failing Scene' });
    film.scene('failure', () => {
        throw new Error('scene failed');
    });

    await assert.rejects(
        runFilm(film, {
            renderer: new StringRenderer(),
            resizeSource: resize.source,
            terminal: { columns: 20, rows: 4 },
        }),
        /scene failed/,
    );

    assert.equal(resize.subscriptions, 1);
    assert.equal(resize.disposals, 1);
});

test('runFilm attempts renderer cleanup when resize disposal fails', async () => {
    let rendererEnded = false;
    let renders = 0;
    const film = defineFilm({ title: 'Cleanup Failure' });
    film.scene('one', async ($) => $.cut());

    await assert.rejects(
        runFilm(film, {
            renderer: {
                render() {
                    renders += 1;
                },
                end() {
                    rendererEnded = true;
                },
            },
            resizeSource: {
                current: () => ({ columns: 20, rows: 4 }),
                onResize: () => () => {
                    throw new Error('resize cleanup failed');
                },
            },
            terminal: { columns: 20, rows: 4 },
        }),
        /resize cleanup failed/,
    );

    assert.equal(rendererEnded, true);
    assert.equal(renders, 1);
});

test('runFilm preserves scene and renderer cleanup failures', async () => {
    const film = defineFilm({ title: 'Combined Failure' });
    film.scene('one', () => {
        throw new Error('scene failed');
    });

    await assert.rejects(
        runFilm(film, {
            renderer: {
                render() {
                    throw new Error('unexpected render');
                },
                end() {
                    throw new Error('renderer cleanup failed');
                },
            },
            terminal: { columns: 20, rows: 4 },
        }),
        (error: unknown) => {
            if (!(error instanceof AggregateError)) {
                return false;
            }

            const failures: unknown[] = error.errors;
            assert.deepEqual(
                failures.map((failure) => failure instanceof Error ? failure.message : failure),
                ['scene failed', 'renderer cleanup failed'],
            );
            return true;
        },
    );
});

interface TrackedResizeSource {
    readonly source: TerminalResizeSource;
    readonly subscriptions: number;
    readonly disposals: number;
}

function createTrackedResizeSource(): TrackedResizeSource {
    let subscriptions = 0;
    let disposals = 0;

    return {
        source: {
            current: () => ({ columns: 20, rows: 4 }),
            onResize: () => {
                subscriptions += 1;
                return () => {
                    disposals += 1;
                };
            },
        },
        get subscriptions() {
            return subscriptions;
        },
        get disposals() {
            return disposals;
        },
    };
}
