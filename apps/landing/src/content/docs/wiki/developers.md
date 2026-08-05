---
title: For developers
description: Contributing to SmartMC.
---

SmartMC is a monorepo: the mod (`apps/mod`, multi-loader via Stonecutter), the companion app (`apps/mobile`, Expo), this site (`apps/landing`), and a shared wire-protocol package (`packages/protocol`, authored once in TypeSpec and generated into both Java and TypeScript).

## Getting started

See [CONTRIBUTING.md](https://github.com/undeaDD/SmartMC/blob/main/CONTRIBUTING.md) in the repository for the full build instructions for each workspace.

## License

SmartMC is licensed under the [PolyForm Noncommercial License 1.0.0](https://github.com/undeaDD/SmartMC/blob/main/LICENSE) — source-available and free to use, modify, and share for any noncommercial purpose.

## Security-sensitive areas

The port-multiplexing Mixin, Noise Protocol transport encryption, and Ed25519 token authorization are the security-critical core of the mod. If you're touching any of those, please call that out explicitly in your PR — see CONTRIBUTING.md for how those pieces fit together.
