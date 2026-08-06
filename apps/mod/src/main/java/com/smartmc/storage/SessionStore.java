package com.smartmc.storage;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The revocation store checked on every reconnect (see CLAUDE.md's "Replay
 * {@literal &} revocation"), independent of the backing engine. See
 * {@code com.smartmc.storage.h2.H2SessionStore} for the current (H2/JDBC)
 * implementation -- callers should depend on this interface, never on a
 * specific backend, so swapping storage engines later only touches the
 * implementation package.
 */
public interface SessionStore {

	void insert(SessionRecord session) throws SQLException;

	Optional<SessionRecord> findByJti(String jti) throws SQLException;

	boolean isRevoked(String jti) throws SQLException;

	void revoke(String jti) throws SQLException;

	/**
	 * Sliding-window token renewal: swaps a session's primary key from
	 * {@code oldJti} to {@code newJti} and bumps its issued-at time, keeping
	 * exactly one row per paired device across its lifetime rather than
	 * accumulating a new row on every reconnect.
	 */
	void rotate(String oldJti, String newJti, long newIssuedAt) throws SQLException;

	List<SessionRecord> findByOwner(UUID ownerUuid) throws SQLException;
}
