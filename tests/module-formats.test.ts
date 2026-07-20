import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'vitest';
import type * as Featurette from '../dist/index.js';
import type * as FeaturetteNode from '../dist/node.js';
import type * as FeaturetteTest from '../dist/test.js';
import { createFakeInput, createFakeOutput } from './helpers.js';

const require = createRequire(import.meta.url);
const commonJs = require('featurette') as typeof Featurette;
const commonJsNode = require('featurette/node') as typeof FeaturetteNode;
const commonJsTest = require('featurette/test') as typeof FeaturetteTest;

test('CommonJS conditions load every public entry point', async () => {
    const film = commonJs.defineFilm({ title: 'CommonJS Conditions' });

    film.scene('one', async ($) => {
        await $.say('process', 'required');
    });

    const rendered = await commonJsTest.renderScene(film, 'one', {
        terminal: { columns: 24, rows: 6 },
    });
    const report = commonJsNode.inspectTerminal({
        input: createFakeInput({ isTTY: false }),
        output: createFakeOutput({ isTTY: false, columns: 24, rows: 6 }),
        env: { TERM: 'dumb', LANG: 'C' },
    });

    assert.match(rendered.transcript, /required/u);
    assert.equal(report.verdict, 'limited');
});
