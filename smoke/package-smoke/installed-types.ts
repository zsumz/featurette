import { resolve } from 'node:path';
import type { NpmFixture, PathRef, SmokeContext } from 'smoque';

const typeSmokeSource = `
    import {
        StringRenderer,
        createScreen,
        defineFilm,
        frameToString,
        play,
        runFilm,
        type MotionFrame,
        type MotionPointFrame,
        type MoveAlongOptions,
        type ResizeEvent,
        type RunFilmResult,
        type ScreenComposeOptions,
        type ScreenShakeOptions,
        type SceneContext,
        type TerminalResizeSource,
        type TweenOptions,
    } from 'featurette';
    import { inspectTerminal, type DoctorReport } from 'featurette/node';
    import { renderScene, type RenderSceneResult } from 'featurette/test';

    const readmeFilm = defineFilm({
        title: 'Signal',
        minSize: { columns: 60, rows: 18 },
        voices: {
            process: { fg: '#f6ae1b', speed: 55 },
        },
    });

    readmeFilm.scene('wake', async ($) => {
        await $.clear();

        await $.type('hello?', {
            at: $.center().up(1),
            voice: 'process',
        });

        await $.beat(800);

        await $.type('oh. you ran me.', {
            at: $.center().down(1),
            voice: 'process',
        });
    });

    const readmePlayback: Promise<RunFilmResult> = play(readmeFilm, {
        renderer: new StringRenderer(),
        terminal: { columns: 60, rows: 18 },
        skip: true,
    });

    const film = defineFilm({
        title: 'Type Smoke',
        voices: {
            process: { speed: 0 },
        },
    });

    film.scene('one', async ($: SceneContext) => {
        const shake: ScreenShakeOptions = { duration: 20, intensity: 1 };
        const tween: TweenOptions = {
            from: { x: 0, y: 0 },
            to: { x: 2, y: 0 },
            draw: (frame: MotionPointFrame) => {
                void frame.point.x;
            },
        };
        const path: MoveAlongOptions = {
            path: [{ x: 0, y: 0 }, { x: 'right', y: 'bottom' }],
            draw: (frame: MotionPointFrame) => {
                void frame.segment;
            },
        };
        const frame: MotionFrame = {
            frame: 0,
            frames: 1,
            elapsed: 0,
            progress: 1,
            eased: 1,
        };
        $.onResize((event: ResizeEvent) => {
            void event.current.columns;
        });
        await $.effects.progress({ label: 'types', width: 4 });
        await $.effects.tween(tween);
        await $.effects.moveAlong(path);
        await $.effects.screenShake(shake);
        await $.say('process', 'typed package');
        void frame;
    });

    const screen = createScreen({ columns: 12, rows: 4 });
    const composeOptions: ScreenComposeOptions = { offset: { x: 1, y: 0 } };
    const composed = frameToString(screen.compose(0, composeOptions));

    const renderer = new StringRenderer();
    const resizeSource: TerminalResizeSource = {
        current: () => ({ columns: 32, rows: 8 }),
        onResize: () => () => {},
    };
    const runResult: Promise<RunFilmResult> = runFilm(film, {
        renderer,
        resizeSource,
        terminal: { columns: 32, rows: 8 },
        skip: true,
    });
    const renderResult: Promise<RenderSceneResult> = renderScene(film, 'one');
    const doctorReport: DoctorReport = inspectTerminal();

    void runResult;
    void readmePlayback;
    void renderResult;
    void doctorReport;
    void composed;
`;

const commonJsTypeSmokeSource = `
    import featurette = require('featurette');
    import featuretteNode = require('featurette/node');
    import featuretteTest = require('featurette/test');

    const film = featurette.defineFilm({ title: 'CommonJS Types' });

    film.scene('one', async ($: featurette.SceneContext) => {
        await $.say('process', 'typed require');
    });

    const rendered: Promise<featuretteTest.RenderSceneResult> =
        featuretteTest.renderScene(film, 'one');
    const report: featuretteNode.DoctorReport = featuretteNode.inspectTerminal();

    void rendered;
    void report;
`;

export async function assertInstalledTypes(
    t: SmokeContext,
    fixture: NpmFixture,
    root: PathRef,
): Promise<void> {
    await t.step('installed package types work in a clean TypeScript project', async () => {
        await fixtureTypeScriptProject(t, fixture);
        await typecheckFixture(t, fixture, root);
    });
}

async function fixtureTypeScriptProject(t: SmokeContext, fixture: NpmFixture): Promise<void> {
    await t.fs.writeText(fixture.path('types.ts'), typeSmokeSource);
    await t.fs.writeText(fixture.path('types.cts'), commonJsTypeSmokeSource);
    await t.fs.writeJson(fixture.path('tsconfig.json'), {
        compilerOptions: {
            lib: ['ES2022'],
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: 'ES2022',
            types: [],
            verbatimModuleSyntax: true,
        },
        include: ['types.ts', 'types.cts'],
    });
}

async function typecheckFixture(
    t: SmokeContext,
    fixture: NpmFixture,
    root: PathRef,
): Promise<void> {
    await t.cmd(
        process.execPath,
        [resolve(String(root), 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--pretty', 'false'],
        { cwd: fixture.path() },
    );
}
