---
title: For server owners
description: Installing and configuring the SmartMC mod.
---

SmartMC is a server-side mod — you don't need to host anything beyond your own Minecraft server. It works over the same port your server already uses (`25565` by default); there's nothing new to open on your firewall.

## Installing

Grab the jar for your loader (Fabric, Forge, or NeoForge) and Minecraft version from the [GitHub releases](https://github.com/undeaDD/SmartMC/releases) once they're published, and drop it in your server's `mods` folder like any other mod.

## Configuring

The mod writes a config file to `config/smartmc/smartmc.json` on first run, with sensible defaults. Notable options:

- `enabled` — a kill switch for the whole feature if you want it off entirely.
- `singleplayerWarningEnabled` — on by default; warns players that a singleplayer world only "counts" as online while the game is actually running.
- `maxDevicesPerPlayer`, `pairingCodeTtlSeconds`, `tokenExpirySeconds` — tune to taste.

Full config reference lands here once the mod ships (see the [roadmap](../../roadmap)).

## Security

The mod's port-multiplexing, transport encryption, and authorization logic are documented in a dedicated threat-model write-up once the first security-relevant release is out — check back before running this on a server you care about.
