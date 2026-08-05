## What does this change?

<!-- Briefly describe the change and why it's needed. -->

## Where

- [ ] Mod (`apps/mod`)
- [ ] Mobile app (`apps/mobile`)
- [ ] Landing site (`apps/landing`)
- [ ] Protocol (`packages/protocol`)

## Checklist

- [ ] If `packages/protocol/schema/*.tsp` changed, ran `bun run protocol:generate` and committed the resulting diff
- [ ] If `apps/mod` changed, ran `./gradlew build` locally for the affected loader(s)/version(s)
- [ ] If this touches port multiplexing, Noise transport, or token/authorization logic, I've called that out explicitly below (security-sensitive — see CONTRIBUTING.md)

## Security-relevant?

<!-- If this touches Layer 0 (port multiplexing), Layer 1 (Noise transport encryption), or Layer 2 (Ed25519 token authorization / device-group scoping), describe what changed and why it's still safe. Otherwise, delete this section. -->
