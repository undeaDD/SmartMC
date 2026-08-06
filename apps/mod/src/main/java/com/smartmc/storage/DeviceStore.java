package com.smartmc.storage;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage contract for devices, independent of the backing engine. See
 * {@code com.smartmc.storage.h2.H2DeviceStore} for the current (H2/JDBC)
 * implementation -- callers should depend on this interface, never on a
 * specific backend, so swapping storage engines later only touches the
 * implementation package.
 */
public interface DeviceStore {

	void insert(DeviceRecord device) throws SQLException;

	Optional<DeviceRecord> findById(String id) throws SQLException;

	List<DeviceRecord> findByOwner(UUID ownerUuid) throws SQLException;

	void delete(String id) throws SQLException;
}
