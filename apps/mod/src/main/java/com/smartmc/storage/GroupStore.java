package com.smartmc.storage;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage contract for groups, independent of the backing engine. See
 * {@code com.smartmc.storage.h2.H2GroupStore} for the current (H2/JDBC)
 * implementation -- callers should depend on this interface, never on a
 * specific backend, so swapping storage engines later only touches the
 * implementation package.
 */
public interface GroupStore {

	void createGroup(String id, String name, UUID ownerUuid) throws SQLException;

	void addMember(String groupId, UUID memberUuid) throws SQLException;

	void removeMember(String groupId, UUID memberUuid) throws SQLException;

	Optional<GroupRecord> findById(String id) throws SQLException;

	List<GroupRecord> findByOwner(UUID ownerUuid) throws SQLException;

	void delete(String id) throws SQLException;
}
