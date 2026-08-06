package com.smartmc.storage.h2;

import com.smartmc.storage.GroupRecord;
import com.smartmc.storage.GroupStore;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class H2GroupStore implements GroupStore {

	private final H2Database database;

	public H2GroupStore(H2Database database) {
		this.database = database;
	}

	@Override
	public void createGroup(String id, String name, UUID ownerUuid) throws SQLException {
		String sql = "MERGE INTO groups (id, name, owner_uuid) KEY (id) VALUES (?, ?, ?)";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, id);
			statement.setString(2, name);
			statement.setString(3, ownerUuid.toString());
			statement.executeUpdate();
		}
	}

	@Override
	public void addMember(String groupId, UUID memberUuid) throws SQLException {
		String sql = "MERGE INTO group_members (group_id, member_uuid) KEY (group_id, member_uuid) VALUES (?, ?)";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, groupId);
			statement.setString(2, memberUuid.toString());
			statement.executeUpdate();
		}
	}

	@Override
	public void removeMember(String groupId, UUID memberUuid) throws SQLException {
		String sql = "DELETE FROM group_members WHERE group_id = ? AND member_uuid = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, groupId);
			statement.setString(2, memberUuid.toString());
			statement.executeUpdate();
		}
	}

	@Override
	public Optional<GroupRecord> findById(String id) throws SQLException {
		String sql = "SELECT * FROM groups WHERE id = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, id);
			try (ResultSet rs = statement.executeQuery()) {
				if (!rs.next()) {
					return Optional.empty();
				}
				String name = rs.getString("name");
				UUID ownerUuid = UUID.fromString(rs.getString("owner_uuid"));
				return Optional.of(new GroupRecord(id, name, ownerUuid, members(id)));
			}
		}
	}

	@Override
	public List<GroupRecord> findByOwner(UUID ownerUuid) throws SQLException {
		String sql = "SELECT id, name FROM groups WHERE owner_uuid = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, ownerUuid.toString());
			try (ResultSet rs = statement.executeQuery()) {
				List<GroupRecord> groups = new ArrayList<>();
				while (rs.next()) {
					String id = rs.getString("id");
					groups.add(new GroupRecord(id, rs.getString("name"), ownerUuid, members(id)));
				}
				return groups;
			}
		}
	}

	@Override
	public void delete(String id) throws SQLException {
		try (PreparedStatement members = database.connection().prepareStatement("DELETE FROM group_members WHERE group_id = ?");
			 PreparedStatement group = database.connection().prepareStatement("DELETE FROM groups WHERE id = ?")) {
			members.setString(1, id);
			members.executeUpdate();
			group.setString(1, id);
			group.executeUpdate();
		}
	}

	private List<UUID> members(String groupId) throws SQLException {
		String sql = "SELECT member_uuid FROM group_members WHERE group_id = ?";
		try (PreparedStatement statement = database.connection().prepareStatement(sql)) {
			statement.setString(1, groupId);
			try (ResultSet rs = statement.executeQuery()) {
				List<UUID> members = new ArrayList<>();
				while (rs.next()) {
					members.add(UUID.fromString(rs.getString("member_uuid")));
				}
				return members;
			}
		}
	}
}
