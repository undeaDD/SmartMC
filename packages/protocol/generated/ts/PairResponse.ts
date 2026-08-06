/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * The mod's reply to a PairRequest.
 */
export interface PairResponse {
  success: boolean;
  /**
   * Present only when success is true: the opaque, versioned auth token
   * (see CLAUDE.md's Security model for its exact format). The app never
   * parses this, only stores and re-presents it.
   */
  token?: string;
  /**
   * Present only when success is true.
   */
  playerUuid?: string;
  /**
   * Present only when success is false -- a player-facing reason (expired
   * code, already used, etc).
   */
  error?: string;
  [k: string]: unknown;
}
