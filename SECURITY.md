# Security Policy

## Supported Versions

SmartMC hasn't made a public release yet, so there's no version line receiving
security patches separately from `main`. Once the first release ships, this
section will be updated to list which versions still receive fixes.

Until then, security reports are welcome against the current `main` branch.

## Reporting a Vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Instead, report it privately using one of these:

- [Private security advisory](https://github.com/undeaDD/SmartMC/security/advisories/new) (preferred) — GitHub's built-in reporting flow, keeps the report confidential until a fix is ready.
- Email undeaD_D@live.de directly.

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof of concept if you have one.
- Which part of the project is affected (mod, app, protocol, landing site).

This is a small, early-stage project maintained in spare time, so please be
patient waiting for a response — but reports are taken seriously and will be
addressed.

## Scope

SmartMC's security-critical surface lives in `apps/mod`, across three layers
(see [CONTRIBUTING.md](CONTRIBUTING.md) for more context; a full written
threat model will be published alongside the first security-relevant
release):

- **Layer 0** — port multiplexing: a Mixin-injected byte peek in front of vanilla Minecraft's own connection handling, discriminating app traffic from real Minecraft clients on the same port.
- **Layer 1** — transport encryption between the app and the mod, via the Noise Protocol Framework (`Noise_XX_25519_ChaChaPoly_SHA256`).
- **Layer 2** — application-level authorization via Ed25519-signed bearer tokens, including pairing, reconnection, and revocation.

Vulnerabilities in any of these layers, or in how pairing codes, tokens, or
sessions are issued, verified, stored, or revoked, are in scope.

Vulnerabilities in third-party dependencies (Minecraft itself, other mods,
the Fabric/NeoForge loaders, FTB Teams, etc.) should be reported to those
projects directly, unless SmartMC's own use of them introduces the issue.

## Out of Scope

- Attacks requiring physical access to a server operator's own hardware, or social engineering of individual users.
- Issues in infrastructure not controlled by this project (a server operator's own hosting, network, or third-party mods they've chosen to install).
