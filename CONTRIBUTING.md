# Contributing to SmartMC

Thanks for taking a look. This project is early — expect things to move and shift.

## Project structure

This is a monorepo:

- `apps/mod` — the Minecraft mod, targeting Fabric and NeoForge (Quilt runs the Fabric build unmodified via its Fabric-compatibility layer). A single shared source tree, preprocessed per version/loader by [Stonecutter](https://stonecutter.kikugie.dev) into a generated Gradle subproject per combination under `versions/`.
- `apps/mobile` — the companion app, Expo (React Native).
- `apps/landing` — the landing/docs site, Astro + Tailwind + Starlight, deployed to GitHub Pages.
- `packages/protocol` — the shared wire protocol, authored once in [TypeSpec](https://typespec.io), compiled to JSON Schema, and generated into both Java and TypeScript types. This is the single source of truth for messages exchanged between the mod and the app — never hand-edit generated output under `generated/`.

`apps/mobile`, `apps/landing`, and `packages/protocol` are [Bun](https://bun.sh) workspaces. `apps/mod` is a separate Gradle build and is intentionally *not* a Bun workspace member — building the mod never requires Node/Bun to be installed, and building the JS workspaces never requires a JVM.

## Building

**JS workspaces** (from repo root):
```bash
bun install
bun run typecheck
```

**Protocol codegen** (after editing anything under `packages/protocol/schema/*.tsp`):
```bash
bun run protocol:generate
```
This regenerates the committed JSON Schema and TypeScript output. CI fails if this produces an uncommitted diff — always run it and commit the result alongside your schema change.

**Mod** (from `apps/mod`):
```bash
./gradlew build
```
This builds every supported Minecraft version × loader combination. The build workflow itself only runs manually on GitHub (`workflow_dispatch`), not on every push — run it locally before opening a PR that touches the mod.

## Security-sensitive code

The mod's Layer 0 (port-multiplexing Mixin), Layer 1 (Noise Protocol transport encryption), and Layer 2 (Ed25519 token authorization) are security-critical. Changes touching any of these should call that out explicitly in the PR description. A written threat model documenting the intended security properties will land alongside the first security-relevant release — check there before making assumptions about what's in scope.

## Reporting a security issue

Please don't open a public issue for a security vulnerability. Open a [private security advisory](../../security/advisories/new) on this repository instead, or contact the maintainer directly.

## Pull requests

- Keep PRs scoped to one change where reasonably possible.
- If you're touching the wire protocol, regenerate (see above) and mention it in the PR.
- Cross-loader/cross-version changes to `apps/mod` should build cleanly for every supported target, not just the one you tested interactively.
