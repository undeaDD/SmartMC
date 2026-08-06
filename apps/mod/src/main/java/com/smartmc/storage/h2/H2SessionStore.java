package com.smartmc.storage.h2;

import com.smartmc.storage.SessionRecord;
import com.smartmc.storage.SessionStore;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class H2SessionStore implements SessionStore {

	private final H2Database database;

	public H2SessionStore(H2Database database) {
		this.database = database;
	}

	@Override
	public void insert(SessionRecord session) throws SQLException {
		String sql = "MERGE INTO sessions (jti, owner_uuid, device_id, issued_at, revoked) KEY (jti) VALUES (?, ?, ?, ?, ?)";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, session.jti());
			statement.setString(2, session.ownerUuid().toString());
			statement.setString(3, session.deviceId());
			statement.setLong(4, session.issuedAt());
			statement.setBoolean(5, session.revoked());
			statement.executeUpdate();
		}
	}

	@Override
	public Optional<SessionRecord> findByJti(String jti) throws SQLException {
		String sql = "SELECT * FROM sessions WHERE jti = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, jti);
			try (ResultSet rs = statement.executeQuery()) {
				return rs.next() ? Optional.of(map(rs)) : Optional.empty();
			}
		}
	}

	@Override
	public boolean isRevoked(String jti) throws SQLException {
		return findByJti(jti).map(SessionRecord::revoked).orElse(true);
	}

	@Override
	public void revoke(String jti) throws SQLException {
		try (PreparedStatement statement = database.connection().prepareStatement("UPDATE sessions SET revoked = TRUE WHERE jti = ?")) {
			statement.setString(1, jti);
			statement.executeUpdate();
		}
	}

	@Override
	public List<SessionRecord> findByOwner(UUID ownerUuid) throws SQLException {
		String sql = "SELECT * FROM sessions WHERE owner_uuid = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, ownerUuid.toString());
			try (ResultSet rs = statement.executeQuery()) {
				List<SessionRecord> sessions = new ArrayList<>();
				while (rs.next()) {
					sessions.add(map(rs));
				}
				return sessions;
			}
		}
	}

	private SessionRecord map(ResultSet rs) throws SQLException {
		return new SessionRecord(
			rs.getString("jti"),
			UUID.fromString(rs.getString("owner_uuid")),
			rs.getString("device_id"),
			rs.getLong("issued_at"),
			rs.getBoolean("revoked")
		);
	}
}
