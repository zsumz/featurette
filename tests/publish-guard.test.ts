import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'vitest';

const execFileAsync = promisify(execFile);
const guardPath = fileURLToPath(new URL('../scripts/publish-guard.mjs', import.meta.url));

test('publish guard allows prerelease alpha and stable latest channels', async () => {
    assert.equal((await runGuard('0.1.0-alpha.0', 'alpha')).code, 0);
    assert.equal((await runGuard('0.1.0', 'latest')).code, 0);
    assert.equal((await runGuard('0.1.0')).code, 0);
});

test('publish guard rejects mismatched release channels', async () => {
    const prereleaseLatest = await runGuard('0.1.0-alpha.0', 'latest');
    const stableAlpha = await runGuard('0.1.0', 'alpha');

    assert.match(prereleaseLatest.stderr, /Publish prereleases with --tag alpha/);
    assert.match(stableAlpha.stderr, /Publish stable releases with --tag latest/);
});

interface GuardResult {
    code: number;
    stderr: string;
}

async function runGuard(version: string, tag?: string): Promise<GuardResult> {
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        npm_package_version: version,
    };

    if (tag === undefined) {
        delete env.npm_config_tag;
    } else {
        env.npm_config_tag = tag;
    }

    try {
        await execFileAsync(process.execPath, [guardPath], { env });
        return { code: 0, stderr: '' };
    } catch (error) {
        const result = error as { code?: number; stderr?: string };
        return {
            code: result.code ?? 1,
            stderr: result.stderr ?? '',
        };
    }
}
