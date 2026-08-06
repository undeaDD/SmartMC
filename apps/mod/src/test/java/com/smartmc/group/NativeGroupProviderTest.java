package com.smartmc.group;

import com.smartmc.storage.GroupRecord;
import com.smartmc.storage.GroupStore;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NativeGroupProviderTest {

	@Test
	void findGroupsForPlayerCombinesOwnedAndMemberGroups() {
		UUID owner = UUID.randomUUID();
		UUID memberOnly = UUID.randomUUID();

		InMemoryGroupStore store = new InMemoryGroupStore();
		store.records.put("owned-group", new GroupRecord("owned-group", "Owned", owner, List.of()));
		store.records.put("invited-group", new GroupRecord("invited-group", "Invited", UUID.randomUUID(), List.of(owner)));

		NativeGroupProvider provider = new NativeGroupProvider(store);

		List<GroupInfo> groups = provider.findGroupsForPlayer(owner);
		assertEquals(2, groups.size());
		assertTrue(groups.stream().anyMatch(g -> g.id().equals("owned-group")));
		assertTrue(groups.stream().anyMatch(g -> g.id().equals("invited-group")));

		assertEquals(List.of(), provider.findGroupsForPlayer(memberOnly));
	}

	@Test
	void findGroupByIdMapsRecordToInfo() {
		UUID owner = UUID.randomUUID();
		UUID member = UUID.randomUUID();
		InMemoryGroupStore store = new InMemoryGroupStore();
		store.records.put("g1", new GroupRecord("g1", "Group One", owner, List.of(member)));

		NativeGroupProvider provider = new NativeGroupProvider(store);

		Optional<GroupInfo> info = provider.findGroupById("g1");
		assertTrue(info.isPresent());
		assertEquals("Group One", info.get().name());
		assertEquals(owner, info.get().ownerUuid());
		assertTrue(info.get().memberUuids().contains(member));
	}

	/** Minimal in-memory {@link GroupStore} test double. */
	private static class InMemoryGroupStore implements GroupStore {
		final Map<String, GroupRecord> records = new HashMap<>();

		@Override
		public void createGroup(String id, String name, UUID ownerUuid) {
			records.put(id, new GroupRecord(id, name, ownerUuid, List.of()));
		}

		@Override
		public void addMember(String groupId, UUID memberUuid) {
			GroupRecord existing = records.get(groupId);
			List<UUID> members = new ArrayList<>(existing.memberUuids());
			members.add(memberUuid);
			records.put(groupId, new GroupRecord(existing.id(), existing.name(), existing.ownerUuid(), members));
		}

		@Override
		public void removeMember(String groupId, UUID memberUuid) {
			GroupRecord existing = records.get(groupId);
			List<UUID> members = new ArrayList<>(existing.memberUuids());
			members.remove(memberUuid);
			records.put(groupId, new GroupRecord(existing.id(), existing.name(), existing.ownerUuid(), members));
		}

		@Override
		public Optional<GroupRecord> findById(String id) {
			return Optional.ofNullable(records.get(id));
		}

		@Override
		public List<GroupRecord> findByOwner(UUID ownerUuid) {
			List<GroupRecord> result = new ArrayList<>();
			for (GroupRecord record : records.values()) {
				if (record.ownerUuid().equals(ownerUuid)) {
					result.add(record);
				}
			}
			return result;
		}

		@Override
		public List<GroupRecord> findByMember(UUID memberUuid) {
			List<GroupRecord> result = new ArrayList<>();
			for (GroupRecord record : records.values()) {
				if (record.memberUuids().contains(memberUuid)) {
					result.add(record);
				}
			}
			return result;
		}

		@Override
		public void delete(String id) {
			records.remove(id);
		}
	}
}
