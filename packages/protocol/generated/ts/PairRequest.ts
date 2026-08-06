/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Sent by the app once the Noise_XX handshake completes, submitting the
 * in-game pairing code the player was shown after running the in-game
 * pairing command (see the players wiki page for the full user-facing flow).
 */
export interface PairRequest {
  pairingCode: string;
  /**
   * Player-chosen, app-side name for this paired device (e.g. "undeaD_D's
   * iPhone") -- stored on the session record so /smartmc sessions list
   * shows something meaningful instead of an opaque session id.
   */
  deviceName: string;
  [k: string]: unknown;
}
