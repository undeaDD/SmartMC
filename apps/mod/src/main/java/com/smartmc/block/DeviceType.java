package com.smartmc.block;

/**
 * Matches {@code DeviceRecord.type()}'s plain-{@code String} storage --
 * {@link #name()} lower-cased is the exact string persisted, so adding a
 * type here never needs a storage migration.
 */
public enum DeviceType {
	SWITCH,
	ALARM,
	INVENTORY_VALUE,
	POWER_VALUE;

	public String storageKey() {
		return name().toLowerCase(java.util.Locale.ROOT);
	}

	public static DeviceType fromStorageKey(String key) {
		return valueOf(key.toUpperCase(java.util.Locale.ROOT));
	}
}
