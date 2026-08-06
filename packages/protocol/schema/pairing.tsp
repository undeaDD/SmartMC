namespace SmartMc.Protocol;

/** Sent by the app once the Noise_XX handshake completes, submitting the
 * in-game pairing code the player was shown after running the in-game
 * pairing command (see the players wiki page for the full user-facing flow). */
model PairRequest {
  pairingCode: string;

  /** Player-chosen, app-side name for this paired device (e.g. "undeaD_D's
   * iPhone") -- stored on the session record so /smartmc sessions list
   * shows something meaningful instead of an opaque session id. */
  deviceName: string;
}

/** The mod's reply to a PairRequest. */
model PairResponse {
  success: boolean;

  /** Present only when success is true: the opaque, versioned auth token
   * (see CLAUDE.md's Security model for its exact format). The app never
   * parses this, only stores and re-presents it. */
  token?: string;

  /** Present only when success is true. */
  playerUuid?: string;

  /** Present only when success is false -- a player-facing reason (expired
   * code, already used, etc). */
  error?: string;
}
