package com.smartmc.storage;

import java.util.UUID;

/**
 * @param groupId nullable -- a device only belongs to a group if explicitly assigned one.
 */
public record DeviceRecord(
	String id,
	String type,
	UUID ownerUuid,
	String groupId,
	String dimension,
	int x,
	int y,
	int z,
	String label
) {
}
