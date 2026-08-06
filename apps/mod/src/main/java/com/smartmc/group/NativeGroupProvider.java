package com.smartmc.group;

import com.smartmc.SmartMC;
import com.smartmc.storage.GroupRecord;
import com.smartmc.storage.GroupStore;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.LinkedHashMap;

/**
 * Wraps SmartMC's own DB-backed {@link GroupStore} (the current default, and
 * always available since it needs no other mod installed). "A player's
 * groups" means groups they own *or* are a listed member of -- owning a
 * group doesn't itself add a {@code group_members} row (see {@code GroupStore}),
 * so both queries are combined and deduplicated by id.
 */
public class NativeGroupProvider implements GroupProvider {

	private final GroupStore groups;

	public NativeGroupProvider(GroupStore groups) {
		this.groups = groups;
	}

	@Override
	public List<GroupInfo> findGroupsForPlayer(UUID playerUuid) {
		try {
			Map<String, GroupRecord> byId = new LinkedHashMap<>();
			for (GroupRecord record : groups.findByOwner(playerUuid)) {
				byId.put(record.id(), record);
			}
			for (GroupRecord record : groups.findByMember(playerUuid)) {
				byId.putIfAbsent(record.id(), record);
			}
			List<GroupInfo> result = new ArrayList<>();
			for (GroupRecord record : byId.values()) {
				result.add(toGroupInfo(record));
			}
			return result;
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to look up native groups for {}", playerUuid, e);
			return List.of();
		}
	}

	@Override
	public Optional<GroupInfo> findGroupById(String id) {
		try {
			return groups.findById(id).map(NativeGroupProvider::toGroupInfo);
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to look up native group {}", id, e);
			return Optional.empty();
		}
	}

	private static GroupInfo toGroupInfo(GroupRecord record) {
		return new GroupInfo(record.id(), record.name(), record.ownerUuid(), new HashSet<>(record.memberUuids()));
	}
}
