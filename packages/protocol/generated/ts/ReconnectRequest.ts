/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Sent by the app to resume an existing session without re-pairing,
 * presenting the token it stored from a previous PairResponse/ReconnectResponse.
 */
export interface ReconnectRequest {
  token: string;
  [k: string]: unknown;
}
