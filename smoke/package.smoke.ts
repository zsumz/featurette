import { smoke } from 'smoque';
import { assertInstalledMetadata } from './package-smoke/installed-metadata.ts';
import { assertInstalledLifecycle } from './package-smoke/installed-lifecycle.ts';
import { assertInstalledRuntime } from './package-smoke/installed-runtime.ts';
import { assertInstalledTypes } from './package-smoke/installed-types.ts';
import { assertTarballShape } from './package-smoke/tarball.ts';
import {
    assertRequiredTools,
    buildPackage,
    createCleanFixture,
    createPackageSmokeWorkspace,
    installPackedPackage,
    packFeaturettePackage,
    preparePackDestination,
} from './package-smoke/workspace.ts';

smoke.suite('featurette package can be packed and imported', { tags: ['package'] }, async (t) => {
    const workspace = await createPackageSmokeWorkspace(t);

    await assertRequiredTools(t);
    await buildPackage(t, workspace.root);
    await preparePackDestination(t, workspace);

    const tarball = await packFeaturettePackage(t, workspace);
    await assertTarballShape(t, tarball);

    const fixture = await createCleanFixture(t, workspace);
    await installPackedPackage(t, fixture, tarball);
    await assertInstalledMetadata(t, fixture);
    await assertInstalledRuntime(t, fixture);
    await assertInstalledLifecycle(t, fixture);
    await assertInstalledTypes(t, fixture, workspace.root);
});
