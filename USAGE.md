# Using Featurette

Featurette films are ordinary TypeScript modules. Define a film, add async scenes, then hand it to the Node runtime.

The package ships ESM and CommonJS entry points for `featurette`, `featurette/node`, and `featurette/test`. Use `import { defineFilm } from 'featurette'` or `const { defineFilm } = require('featurette')`.

## Start a Film

```ts
import { defineFilm, play } from 'featurette';

const film = defineFilm({
    title: 'The Last Process',
    fps: 24,
    minSize: { columns: 80, rows: 24 },
    palette: {
        process: '#6ee7f9',
        system: '#8a8f98',
        memory: '#ffd166',
    },
    voices: {
        process: { fg: 'process', speed: 55 },
        system: { fg: 'system', speed: 0, dim: true },
        memory: { fg: 'memory', speed: 35 },
    },
});

film.scene('wake', async ($) => {
    await $.say('process', 'hello?');
    await $.beat(900);
    await $.say('process', 'oh. you ran me.');
});

await play(film);
```

Scenes run in declaration order. Give `play` a `scene` option to start with one scene, or use `playCli` to expose the built-in command-line flags.

## Write in Beats

The scene context is the stage. Its text methods carry timing, position, voice, and transcript behavior.

```ts
film.scene('memory', async ($) => {
    await $.type('I remember everything.', {
        at: { x: 'center', y: 'middle', dx: -10 },
        voice: 'process',
        advance: 'none',
    });

    await $.beat(1200);
    await $.backspace(11, { voice: 'process' });
    await $.type('nothing.', { voice: 'memory' });
});
```

Use `type`, `say`, `reveal`, `replace`, `backspace`, `redact`, and `glitchText` for authored text. Use `beat` or `wait` for silence.

## Compose the Frame

Draw directly or build named layers. A layer persists until you clear it; `cut` renders the current composition.

```ts
film.scene('signal', async ($) => {
    const sky = $.layer('sky', { zIndex: 1 });
    const signal = $.layer('signal', { zIndex: 10 });

    sky.text(8, 3, '.', { fg: 'memory', dim: true });
    sky.text(36, 6, '*', { fg: 'memory', bold: true });
    signal.box(24, 9, 30, 5, { title: 'incoming' });
    signal.text(30, 11, 'are you still there?', { fg: 'process' });

    await $.cut();
});
```

The drawing API also includes lines, frames, sprites, progress bars, logs, diffs, and trees. Positions accept terminal-aware anchors such as `center`, `middle`, `right`, and `bottom-4`.

## Use Effects

Effects are timed scene actions, not detached animation loops.

```ts
await $.effects.titleCard({
    title: 'STILL RUNNING',
    subtitle: 'a terminal story',
    duration: 1200,
    voice: 'process',
});

await $.effects.starfield({
    density: 0.08,
    duration: 1400,
    seed: 7,
    colors: ['memory'],
});

await $.effects.glitch({ duration: 180, intensity: 0.35 });
```

Featurette includes fades, wipes, starfields, glitches, scanlines, countdowns, screen shake, log streams, progress bars, test runners, and merge conflicts.

## Move Something

Use a timeline when the story needs motion. Featurette resolves anchored points and collapses motion to its final frame when reduced motion is enabled.

```ts
await $.effects.moveAlong({
    path: [
        { x: 'left', y: 'middle' },
        { x: 'center', y: 'middle', dy: -3 },
        { x: 'right', y: 'middle' },
    ],
    subject: { columns: 1, rows: 1 },
    duration: 1400,
    easing: 'ease-in-out',
    layer: 'signal',
    draw: ({ point, layer }) => {
        layer?.text(point.x, point.y, '*', { fg: 'memory' });
    },
});
```

Use `tween` for movement between two points and `keyframes` when you need control over every frame.

## Handle Input and Resize

```ts
film.scene('interactive', async ($) => {
    const stopKey = $.input.onKey('space', async () => {
        $.draw.text(0, 2, 'signal acknowledged', { fg: 'process' });
        await $.cut();
    });
    const stopResize = $.onResize(async ({ current }) => {
        await $.clear();
        $.draw.text(0, 0, `${current.columns} x ${current.rows}`);
        await $.cut();
    });

    await $.say('system', 'press space');
    await $.beat(3000);

    stopKey();
    stopResize();
});
```

Register `film.onInterrupt(...)` for film-wide Ctrl+C handling. Featurette restores raw mode, the cursor, the alternate screen, and listeners when playback ends.
Scene input bindings are disposed automatically when their scene ends; call the returned function when a binding should stop earlier.

Interrupt handlers run inside the active scene's control flow, so they can author a final beat and then stop or skip cleanly:

```ts
film.onInterrupt(async ($) => {
    await $.say('process', 'returning control.');
    $.quit();
});
```

Featurette also restores stdin to its previous paused or flowing state. A visual film does not need to call `process.stdin.pause()` after `play` returns.

Playback results report `termination` as `completed`, `quit`, or `interrupted`. `playCli` sets `process.exitCode` to `130` after an interrupt-driven quit; authored calls to `$.quit()` remain successful exits.

Set a live resize policy on the film when its stage should not reflow with the terminal:

```ts
const film = defineFilm({
    title: 'Signal',
    minSize: { columns: 80, rows: 24 },
    resize: 'letterbox',
    tooSmall: 'transcript',
});
```

`letterbox` preserves and centers the original stage, `crop` preserves and clips it from the top-left, and `transcript` switches to plain-text playback after a resize. Without `resize`, the stage remains responsive. Every live resize rechecks `minSize`; `tooSmall` then chooses whether to request a resize, switch to transcript, or keep playing.

## Play It

`play` uses the current terminal and falls back to a plain-text transcript when output is not interactive.

```ts
import { play } from 'featurette';

await play(film, {
    reducedMotion: false,
    transcriptWhenNonTTY: true,
});
```

For an executable film, call `playCli` in its entry point:

```ts
import { playCli } from 'featurette/node';

await playCli(film);
```

The runtime understands:

```txt
--scene <name>
--speed <multiplier>
--transcript
--reduced-motion
--skip
--no-color
--no-unicode
--no-alt-screen
--no-ansi
```

## Test It

`featurette/test` renders with a fake clock and an in-memory renderer, so scene tests are instant and deterministic.

```ts
import { expect, test } from 'vitest';
import { renderScene } from 'featurette/test';
import { film } from './film.js';

test('the process wakes up', async () => {
    const result = await renderScene(film, 'wake', {
        terminal: { columns: 80, rows: 24 },
    });

    expect(result.lastFrame).toContain('oh. you ran me.');
    expect(result.transcript).toContain('hello?');
});
```

Use `renderFilm` for the whole film and `renderAt` to inspect the first rendered frame at or after a scene timestamp.

## Film Options

| Option | Purpose |
| --- | --- |
| `title` | Names the film. |
| `fps` | Sets default effect timing. |
| `palette` | Maps semantic color names to terminal colors. |
| `voices` | Defines text style, speed, prefix, cursor, and jitter by voice. |
| `minSize` | Declares the intended terminal dimensions. |
| `resize` | Chooses `letterbox`, `crop`, or `transcript` behavior after a live resize. |
| `tooSmall` | Chooses `resize`, `transcript`, or `play` for undersized terminals. |
| `reducedMotion` | Collapses motion-heavy effects to accessible final states. |

Return to the [README](./README.md).
