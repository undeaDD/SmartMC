package com.smartmc.storage.h2;

import com.smartmc.storage.DeviceRecord;
import com.smartmc.storage.DeviceStore;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class H2DeviceStore implements DeviceStore {

	private final H2Database database;

	public H2DeviceStore(H2Database database) {
		this.database = database;
	}

	@Override
	public void insert(DeviceRecord device) throws SQLException {
		String sql = """
			MERGE INTO devices (id, type, owner_uuid, group_id, dimension, pos_x, pos_y, pos_z, label)
			KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			""";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, device.id());
			statement.setString(2, device.type());
			statement.setString(3, device.ownerUuid().toString());
			statement.setString(4, device.groupId());
			statement.setString(5, device.dimension());
			statement.setInt(6, device.x());
			statement.setInt(7, device.y());
			statement.setInt(8, device.z());
			statement.setString(9, device.label());
			statement.executeUpdate();
		}
	}

	@Override
	public Optional<DeviceRecord> findById(String id) throws SQLException {
		String sql = "SELECT * FROM devices WHERE id = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, id);
			try (ResultSet rs = statement.executeQuery()) {
				return rs.next() ? Optional.of(map(rs)) : Optional.empty();
			}
		}
	}

	@Override
	public List<DeviceRecord> findByOwner(UUID ownerUuid) throws SQLException {
		String sql = "SELECT * FROM devices WHERE owner_uuid = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, ownerUuid.toString());
			try (ResultSet rs = statement.executeQuery()) {
				List<DeviceRecord> devices = new ArrayList<>();
				while (rs.next()) {
					devices.add(map(rs));
				}
				return devices;
			}
		}
	}

	@Override
	public void delete(String id) throws SQLException {
		try (PreparedStatement statement = database.connection().prepareStatement("DELETE FROM devices WHERE id = ?")) {
			statement.setString(1, id);
			statement.executeUpdate();
		}
	}

	private DeviceRecord map(ResultSet rs) throws SQLException {
		return new DeviceRecord(
			rs.getString("id"),
			rs.getString("type"),
			UUID.fromString(rs.getString("owner_uuid")),
			rs.getString("group_id"),
			rs.getString("dimension"),
			rs.getInt("pos_x"),
			rs.getInt("pos_y"),
			rs.getInt("pos_z"),
			rs.getString("label")
		);
	}
}
