namespace SmartMc.Protocol;

/** Sent by the app to resume an existing session without re-pairing,
 * presenting the token it stored from a previous PairResponse/ReconnectResponse. */
model ReconnectRequest {
  token: string;
}

/** The mod's reply to a ReconnectRequest. On success, the mod always issues a
 * fresh token (sliding-window renewal) -- the app must overwrite its stored
 * token with the new one, even though the reconnect itself succeeded. */
model ReconnectResponse {
  success: boolean;

  /** Present only when success is true: the new token, replacing the one submitted. */
  token?: string;

  /** Present only when success is true. */
  playerUuid?: string;

  /** Present only when success is false -- a player-facing reason
   * (expired, revoked, malformed) telling the app it needs to re-pair. */
  error?: string;
}
