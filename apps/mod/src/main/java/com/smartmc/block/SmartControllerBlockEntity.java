package com.smartmc.block;

import com.smartmc.storage.DeviceRecord;
import net.minecraft.core.BlockPos;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;

import java.util.UUID;

//? >= 1.20.5 {
import net.minecraft.core.HolderLookup;
//?}

/**
 * Holds one device's identity/config in-world, persisted through
 * {@code DeviceStore} (see {@link SmartControllerBlock#setPlacedBy} /
 * {@link SmartControllerBlock#onRemove} for the insert/delete hooks) --
 * NBT here is this block entity's own on-disk copy of the same fields, kept
 * in sync so a reload doesn't need a DB round-trip to know its own identity.
 *
 * <p><b>v1 simplification, per explicit direction:</b> no in-world GUI yet --
 * every newly-placed device defaults to {@code SWITCH}, label {@code "test
 * name"}, private (no group), powered off. Configuring a device for real is
 * follow-up work; this pass is about the block existing, persisting, and
 * being reachable over the wire at all.
 */
public class SmartControllerBlockEntity extends BlockEntity {

	private UUID deviceId = UUID.randomUUID();
	private DeviceType deviceType = DeviceType.SWITCH;
	private String label = "test name";
	private String groupId;
	private UUID ownerUuid;

	public SmartControllerBlockEntity(BlockPos pos, BlockState state) {
		super(ModBlockEntities.smartController(), pos, state);
	}

	public UUID deviceId() {
		return deviceId;
	}

	public DeviceType deviceType() {
		return deviceType;
	}

	public void setDeviceType(DeviceType deviceType) {
		this.deviceType = deviceType;
		setChanged();
	}

	public String label() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
		setChanged();
	}

	/** Null means private (owner-only); set means shared with that group -- matches {@code DeviceRecord.groupId()}. */
	public String groupId() {
		return groupId;
	}

	public void setGroupId(String groupId) {
		this.groupId = groupId;
		setChanged();
	}

	public UUID ownerUuid() {
		return ownerUuid;
	}

	public void setOwnerUuid(UUID ownerUuid) {
		this.ownerUuid = ownerUuid;
		setChanged();
	}

	/** Snapshot for {@code DeviceStore} -- {@link #ownerUuid} must already be set (see {@code setPlacedBy}). */
	public DeviceRecord toDeviceRecord() {
		Level level = getLevel();
		String dimension = level != null ? level.dimension().location().toString() : "";
		return new DeviceRecord(
			deviceId.toString(), deviceType.storageKey(), ownerUuid, groupId,
			dimension, getBlockPos().getX(), getBlockPos().getY(), getBlockPos().getZ(), label);
	}

	private void writeTag(CompoundTag tag) {
		tag.putUUID("DeviceId", deviceId);
		tag.putString("DeviceType", deviceType.storageKey());
		tag.putString("Label", label);
		if (groupId != null) {
			tag.putString("GroupId", groupId);
		}
		if (ownerUuid != null) {
			tag.putUUID("OwnerUuid", ownerUuid);
		}
	}

	private void readTag(CompoundTag tag) {
		if (tag.hasUUID("DeviceId")) {
			deviceId = tag.getUUID("DeviceId");
		}
		if (tag.contains("DeviceType")) {
			deviceType = DeviceType.fromStorageKey(tag.getString("DeviceType"));
		}
		label = tag.getString("Label");
		groupId = tag.contains("GroupId") ? tag.getString("GroupId") : null;
		ownerUuid = tag.hasUUID("OwnerUuid") ? tag.getUUID("OwnerUuid") : null;
	}

	//? >= 1.20.5 {
	@Override
	protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
		super.saveAdditional(tag, registries);
		writeTag(tag);
	}

	@Override
	protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
		super.loadAdditional(tag, registries);
		readTag(tag);
	}
	//?} else {
	/*@Override
	public void saveAdditional(CompoundTag tag) {
		super.saveAdditional(tag);
		writeTag(tag);
	}

	@Override
	public void load(CompoundTag tag) {
		super.load(tag);
		readTag(tag);
	}
	*///?}
}
