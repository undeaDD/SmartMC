/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * The mod's reply to a ReconnectRequest. On success, the mod always issues a
 * fresh token (sliding-window renewal) -- the app must overwrite its stored
 * token with the new one, even though the reconnect itself succeeded.
 */
export interface ReconnectResponse {
  success: boolean;
  /**
   * Present only when success is true: the new token, replacing the one submitted.
   */
  token?: string;
  /**
   * Present only when success is true.
   */
  playerUuid?: string;
  /**
   * Present only when success is false -- a player-facing reason
   * (expired, revoked, malformed) telling the app it needs to re-pair.
   */
  error?: string;
  [k: string]: unknown;
}
