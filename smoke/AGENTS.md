# Smoke Test Conventions

Use `smoque`.

## Structure

- Put smoke files under `smoke/`.
- Name files `*.smoke.ts`.
- Keep smoke-file TypeScript erasable so Node can strip types without a build step.
- Use `smoke.suite("name", async (t) => { ... })`.
- Wrap every meaningful action in `await t.step("name", async () => { ... })`.

## Package Truth

- Smoke the packed tarball, not only source imports.
- Install into a clean fixture.
- Verify exported entry points, generated types, and runtime behavior from the installed package.
- Assert that local-only files stay out of the tarball.
