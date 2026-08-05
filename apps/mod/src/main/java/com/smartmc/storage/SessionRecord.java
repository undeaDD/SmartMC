package com.smartmc.storage;

import java.util.UUID;

/**
 * A revocation-store entry for one issued token. Pairing codes themselves
 * are never persisted (in-memory, single-use, TTL-bound) -- this record is
 * only for tokens that have actually been issued, checked on reconnect.
 */
public record SessionRecord(String jti, UUID ownerUuid, String deviceId, long issuedAt, boolean revoked) {
}
