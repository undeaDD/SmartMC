# SmartMC

A Minecraft-native smart home / alarm platform. A mod (Fabric, NeoForge, Quilt) turns your Minecraft server into the entire backend for a companion phone app — no separate service to host, no central server owned by anyone but the world's own server operator.

Players pair their phone with a server using an in-game code, then get real-time notifications and control for in-world "smart devices" — starting with a simple redstone-triggered alarm — scoped to devices they own or share with a group. All of it rides on the single port the server already listens on (default `25565`); nothing new to open on your firewall.

## Status

This project is in early, active development. See the [roadmap](#) on the landing site once it's live for milestone-by-milestone progress.

## Why source-available, noncommercial

SmartMC is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE) — you're free to read, run, modify, and share it for any noncommercial purpose, but it is **not** an OSI-approved "open source" license (it restricts commercial use). This is a deliberate choice, not an oversight.

## Repository layout

```
apps/
  mobile/    Expo React Native companion app
  landing/   Landing / docs site (GitHub Pages)
  mod/       The Minecraft mod (Fabric / NeoForge, multi-version via Stonecutter; Quilt runs the Fabric jar unmodified)
packages/
  protocol/  Shared wire-protocol schema (TypeSpec), generated Java + TypeScript types
```

## Building

Each workspace builds independently:

- **Mod** (`apps/mod`): `./gradlew build` (requires a JDK matching the target Minecraft version's toolchain).
- **App / protocol / landing** (JS workspaces): `bun install`, then `bun run <script>` from the relevant workspace, or from the repo root.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more detail.

## Security

If you find a security issue, please do not open a public issue — see [CONTRIBUTING.md](CONTRIBUTING.md) for how to report it responsibly. A written threat model will be published alongside the first security-relevant release.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — Copyright © 2026 undeaDD.
