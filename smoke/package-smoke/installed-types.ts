import { resolve } from 'node:path';
import type { NpmFixture, PathRef, SmokeContext } from 'smoque';

const typeSmokeSource = `
    import {
        StringRenderer,
        createScreen,
        defineFilm,
        frameToString,
        runFilm,
        type RunFilmResult,
        type ScreenComposeOptions,
        type ScreenShakeOptions,
        type SceneContext,
    } from 'featurette';
    import { inspectTerminal, type DoctorReport } from 'featurette/node';
    import { renderScene, type RenderSceneResult } from 'featurette/test';

    const film = defineFilm({
        title: 'Type Smoke',
        voices: {
            process: { speed: 0 },
        },
    });

    film.scene('one', async ($: SceneContext) => {
        const shake: ScreenShakeOptions = { duration: 20, intensity: 1 };
        await $.effects.progress({ label: 'types', width: 4 });
        await $.effects.screenShake(shake);
        await $.say('process', 'typed package');
    });

    const screen = createScreen({ columns: 12, rows: 4 });
    const composeOptions: ScreenComposeOptions = { offset: { x: 1, y: 0 } };
    const composed = frameToString(screen.compose(0, composeOptions));

    const renderer = new StringRenderer();
    const runResult: Promise<RunFilmResult> = runFilm(film, {
        renderer,
        terminal: { columns: 32, rows: 8 },
        skip: true,
    });
    const renderResult: Promise<RenderSceneResult> = renderScene(film, 'one');
    const doctorReport: DoctorReport = inspectTerminal();

    void runResult;
    void renderResult;
    void doctorReport;
    void composed;
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
        include: ['types.ts'],
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
