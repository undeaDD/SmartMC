package com.smartmc.storage.h2;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Owns the single JDBC connection to the server's embedded H2 database
 * (one Minecraft server process, no connection pool needed at this scale).
 * H2 was chosen over SQLite specifically to avoid SQLite's native (JNI)
 * library in a heavily-modded server environment -- H2 is pure Java.
 * File lives at {@code config/smartmc/data/smartmc.mv.db}.
 */
public class H2Database implements AutoCloseable {

	private final Connection connection;

	private H2Database(Connection connection) {
		this.connection = connection;
	}

	public static H2Database open(Path configDir) throws SQLException {
		Path dataDir = configDir.resolve("data");
		try {
			Files.createDirectories(dataDir);
		} catch (Exception e) {
			throw new SQLException("Failed to create " + dataDir, e);
		}

		String url = "jdbc:h2:file:" + dataDir.resolve("smartmc").toAbsolutePath();
		Connection connection = DriverManager.getConnection(url);
		H2Database database = new H2Database(connection);
		database.ensureSchema();
		return database;
	}

	Connection connection() {
		return connection;
	}

	private void ensureSchema() throws SQLException {
		try (Statement statement = connection.createStatement()) {
			statement.execute("""
				CREATE TABLE IF NOT EXISTS devices (
				  id TEXT PRIMARY KEY,
				  type TEXT NOT NULL,
				  owner_uuid TEXT NOT NULL,
				  group_id TEXT,
				  dimension TEXT NOT NULL,
				  pos_x INT NOT NULL,
				  pos_y INT NOT NULL,
				  pos_z INT NOT NULL,
				  label TEXT NOT NULL
				)
				""");
			statement.execute("""
				CREATE TABLE IF NOT EXISTS groups (
				  id TEXT PRIMARY KEY,
				  name TEXT NOT NULL,
				  owner_uuid TEXT NOT NULL
				)
				""");
			statement.execute("""
				CREATE TABLE IF NOT EXISTS group_members (
				  group_id TEXT NOT NULL REFERENCES groups(id),
				  member_uuid TEXT NOT NULL,
				  PRIMARY KEY (group_id, member_uuid)
				)
				""");
			statement.execute("""
				CREATE TABLE IF NOT EXISTS sessions (
				  jti TEXT PRIMARY KEY,
				  owner_uuid TEXT NOT NULL,
				  device_id TEXT NOT NULL,
				  issued_at BIGINT NOT NULL,
				  revoked BOOLEAN NOT NULL DEFAULT FALSE
				)
				""");
		}
	}

	@Override
	public void close() throws SQLException {
		connection.close();
	}
}
