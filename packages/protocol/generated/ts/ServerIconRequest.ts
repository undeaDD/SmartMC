/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Sent by the app to fetch the server's icon, for the paired-server list and detail view -- same `server-icon.png` vanilla itself shows in the multiplayer server list, not a SmartMC-specific asset.
 */
export interface ServerIconRequest {
  token: string;
  [k: string]: unknown;
}
