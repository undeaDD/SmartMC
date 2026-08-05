/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * A trivial ping/pong pair used only to prove the TypeSpec -> JSON Schema -> Java + TS codegen pipeline end to end (M0 gate). Not part of the real protocol.
 */
export interface PingMessage {
  /**
   * Monotonically increasing sequence number set by the sender.
   */
  sequence: number;
  /**
   * Free-form text echoed back by the receiver.
   */
  message: string;
  [k: string]: unknown;
}
