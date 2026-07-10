const version = process.env.npm_package_version ?? '';
const tag = process.env.npm_config_tag ?? 'latest';
const prerelease = version.includes('-');

if (!version) {
    fail('Could not read npm_package_version.');
}

if (prerelease && tag !== 'alpha') {
    fail('Publish prereleases with --tag alpha.');
}

if (!prerelease && tag === 'alpha') {
    fail('Publish stable releases with --tag latest.');
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
