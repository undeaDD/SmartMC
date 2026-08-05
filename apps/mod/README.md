# SmartMC mod

The Minecraft mod half of [SmartMC](../../README.md) — Fabric, Forge, and NeoForge from one codebase, using [Stonecutter](https://stonecutter.kikugie.dev/) for multi-loader (and eventually multi-version) support.

Licensed under the repo's root [LICENSE](../../LICENSE) (PolyForm Noncommercial 1.0.0), not the MIT license this template originally shipped under.

## Version coverage

Currently targets **Minecraft 1.21.1** only, across Fabric, Forge, and NeoForge. The original plan called for a 1.20.1 floor version too, but that's not actually possible for NeoForge — it has no build for 1.20.1 at all; its earliest release (`20.2.x`) targets Minecraft 1.20.2. 1.21.1 is also the real dogfooding target (the Opolis modpack). Expanding version coverage, and picking the real floor version, is deferred to M3.

## Structure

- `src/main/java/com/smartmc/` — shared code (no loader-specific imports).
- `src/main/java/com/smartmc/platform/{fabric,forge,neoforge}/` — thin per-loader entrypoints and a `Platform` implementation each.
- `src/main/java/com/smartmc/mixin/` — Mixins, wired via `smartmc.mixins.json`. `ServerLifecycleMixin` is a placeholder proving the Mixin pipeline works end to end on every loader — the real port-multiplexing Mixin (M1) replaces/extends it.
- `stonecutter.properties.toml` — mod metadata and per-version/per-loader dependency versions.
- `settings.gradle.kts` — the actual version × loader matrix (`stonecutter { create(rootProject) { match(...) } }`).

Platform-conditional code uses Stonecutter's comment syntax:

```java
//? fabric {
fabricOnlyCode();
//?} else {
/*neoforgeOrForgeOnlyCode();*/
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

Access Wideners (Fabric) and Access Transformers ((Neo)Forge) live in `src/main/resources/aw/`, one pair per supported Minecraft version.

## Attribution

Scaffolded from [rotgruengelb/stonecutter-mod-template](https://github.com/rotgruengelb/stonecutter-mod-template), which itself credits [murderspagurder/mod-template-java](https://github.com/murderspagurder/mod-template-java) and [KikuGie's Elytra Trims](https://github.com/kikugie/elytra-trims) setup. Uses [Stonecutter](https://stonecutter.kikugie.dev/) by KikuGie.
