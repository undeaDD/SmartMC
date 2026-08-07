# SmartMC mod

The Minecraft mod half of [SmartMC](../../README.md) — Fabric, NeoForge, and classic Forge from one codebase, using [Stonecutter](https://stonecutter.kikugie.dev/) for multi-loader and multi-version support. Quilt is also supported: it isn't a separate build target, since Quilt's built-in Fabric-compatibility layer runs the Fabric jar unmodified.

Licensed under the repo's root [LICENSE](../../LICENSE) (PolyForm Noncommercial 1.0.0), not the MIT license this template originally shipped under.

## Version coverage

- **Fabric / NeoForge / Quilt: Minecraft 1.21.1**, also the real dogfooding target (the Opolis modpack). The floor for this modern trio is 1.20.2 — NeoForge has no build below that at all (its earliest release, `20.2.x`, targets 1.20.2) — with no further expansion below that planned; that range is Forge's job instead (see below).
- **Classic Forge: Minecraft 1.19.2–1.20.1**, covering legacy modpacks the modern trio can't reach. Capped at 1.20.1 on purpose: Forge kept publishing past the NeoForge fork (it has 1.21.x builds too), but going higher would just duplicate NeoForge's own coverage for no benefit — 1.20.1 is exactly the boundary where Forge is the only option, and also the ceiling of the `net.neoforged.moddev.legacyforge` plugin this uses (see below). Floored at 1.19.2 rather than going further back (e.g. 1.16.5 or 1.12.2, the single most popular legacy modpack version by far) because that's as far back as the same modern ForgeGradle-era toolchain and Java 17 reach — going lower would mean a second, much older ForgeGradle-2/3-era toolchain, a real "maybe someday" rather than part of this pass.

## How Forge builds despite not being NeoForge

Classic Forge builds via `net.neoforged.moddev.legacyforge` — an addon on the same ModDevGradle plugin family the `neoforge` target already uses, not a second unrelated toolchain. It only supports Minecraft 1.17–1.20.1 (confirmed against its own docs), which is exactly why this project's Forge range stops at 1.20.1 and why an earlier attempt at Forge support (back when this project only targeted 1.21.1) failed and was dropped — 1.21.1 was simply out of range for any Forge build via this plugin. Modern Forge (1.21.x) still only builds via the separate, unrelated classic ForgeGradle toolchain (`net.minecraftforge.gradle`) — not used here, since NeoForge already fully covers that range.

## Structure

- `src/main/java/com/smartmc/` — shared code (no loader-specific imports).
- `src/main/java/com/smartmc/platform/{fabric,neoforge,forge}/` — thin per-loader entrypoints and a `Platform` implementation each.
- `src/main/java/com/smartmc/mixin/` — Mixins, wired via `smartmc.mixins.json`. `ServerLifecycleMixin` is a placeholder proving the Mixin pipeline works end to end on every loader — the real port-multiplexing Mixin (M1) replaces/extends it.
- `stonecutter.properties.toml` — mod metadata and per-version/per-loader dependency versions.
- `settings.gradle.kts` — the actual version × loader matrix (`stonecutter { create(rootProject) { match(...) } }`).

Platform-conditional code uses Stonecutter's comment syntax:

```java
//? fabric {
fabricOnlyCode();
//?} else {
/*neoforgeOnlyCode();*/
//?}
```

## Building

```bash
./gradlew build
```

Builds every configured version × loader combination. To build/run just one target, use its Stonecutter project name, e.g.:

```bash
./gradlew :1.21.1-fabric:build
./gradlew :1.21.1-fabric:runServer
```

Access Wideners (Fabric) and Access Transformers (NeoForge, Forge) live in `src/main/resources/aw/`, one Access Widener + Access Transformer pair per supported Minecraft version.

## Attribution

Scaffolded from [rotgruengelb/stonecutter-mod-template](https://github.com/rotgruengelb/stonecutter-mod-template), which itself credits [murderspagurder/mod-template-java](https://github.com/murderspagurder/mod-template-java) and [KikuGie's Elytra Trims](https://github.com/kikugie/elytra-trims) setup. Uses [Stonecutter](https://stonecutter.kikugie.dev/) by KikuGie.
