import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    defineFilm,
    InputController,
    runFilm,
    StringRenderer,
    type Clock,
} from '../dist/index.js';
import { flushPromises } from './helpers.js';

test('an interrupt handler owns the screen while the active scene is suspended', async () => {
    const film = defineFilm({ title: 'Interrupt Handoff' });
    const controller = new InputController();
    const renderer = new StringRenderer();
    const clock = new GatedClock();
    let interrupts = 0;

    film.onInterrupt(async ($) => {
        interrupts += 1;
        await $.clear();
        await $.type('graceful goodbye', { at: { x: 0, y: 0 }, speed: 10 });
        $.quit();
    });
    film.scene('typing', async ($) => {
        $.draw.text(0, 2, 'old scene');
        await $.cut();
        await $.type('still typing', { at: { x: 0, y: 3 }, speed: 10 });
    });

    const playback = runFilm(film, {
        clock,
        input: controller,
        renderer,
        terminal: { columns: 40, rows: 8 },
    });

    await flushPromises();
    const interruption = controller.emitCtrlC();
    await flushPromises();
    await controller.emitCtrlC();
    clock.release(0);
    await flushPromises();

    assert.equal(interrupts, 1);
    assert.doesNotMatch(renderer.lastFrame(), /still typing/);

    clock.release(1);
    await interruption;
    const result = await playback;

    assert.equal(result.termination, 'interrupted');
    assert.match(renderer.lastFrame(), /graceful goodbye/);
    assert.doesNotMatch(renderer.lastFrame(), /still typing/);
});

test('the active scene resumes after an interrupt handler releases the screen', async () => {
    const film = defineFilm({ title: 'Interrupt Resume' });
    const controller = new InputController();
    const renderer = new StringRenderer();
    const clock = new GatedClock();

    film.onInterrupt(async ($) => {
        await $.clear();
        $.draw.text(0, 0, 'paused');
        await $.cut();
        await $.wait(10);
    });
    film.scene('waiting', async ($) => {
        await $.wait(10);
        $.draw.text(0, 0, 'resumed');
        await $.cut();
    });

    const playback = runFilm(film, {
        clock,
        input: controller,
        renderer,
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    const interruption = controller.emitCtrlC();
    await flushPromises();
    clock.release(0);
    await flushPromises();

    assert.match(renderer.lastFrame(), /paused/);
    assert.doesNotMatch(renderer.lastFrame(), /resumed/);

    clock.release(1);
    await interruption;
    const result = await playback;

    assert.equal(result.termination, 'completed');
    assert.match(renderer.lastFrame(), /resumed/);
});

test('scene input cannot render while an interrupt handler owns the screen', async () => {
    const film = defineFilm({ title: 'Interrupt Input Isolation' });
    const controller = new InputController();
    const renderer = new StringRenderer();
    const clock = new GatedClock();

    film.onInterrupt(async ($) => {
        await $.clear();
        $.draw.text(0, 0, 'goodbye');
        await $.cut();
        await $.wait(10);
        $.quit();
    });
    film.scene('waiting', async ($) => {
        $.input.onKey('space', async () => {
            await $.clear();
            $.draw.text(0, 0, 'scene input');
            await $.cut();
        });
        await $.wait(60_000);
    });

    const playback = runFilm(film, {
        clock,
        input: controller,
        renderer,
        terminal: { columns: 20, rows: 4 },
    });

    await flushPromises();
    const interruption = controller.emitCtrlC();
    await flushPromises();
    const input = controller.emitKey({ name: 'space' });
    await flushPromises();

    assert.match(renderer.lastFrame(), /goodbye/);
    assert.doesNotMatch(renderer.lastFrame(), /scene input/);

    clock.release(1);
    await Promise.all([interruption, input]);
    const result = await playback;

    assert.equal(result.termination, 'interrupted');
    assert.match(renderer.lastFrame(), /goodbye/);
    assert.doesNotMatch(renderer.lastFrame(), /scene input/);
});

class GatedClock implements Clock {
    private elapsed = 0;
    private readonly releases: Array<(() => void) | undefined> = [];
    private waits = 0;

    public now(): number {
        return this.elapsed;
    }

    public async wait(ms: number): Promise<void> {
        this.elapsed += ms;
        const wait = this.waits;
        this.waits += 1;

        if (wait > 1) {
            return;
        }

        await new Promise<void>((resolve) => {
            this.releases[wait] = resolve;
        });
    }

    public release(wait: number): void {
        this.releases[wait]?.();
    }
}
