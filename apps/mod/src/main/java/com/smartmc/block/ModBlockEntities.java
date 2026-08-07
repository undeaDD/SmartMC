package com.smartmc.block;

import net.minecraft.world.level.block.entity.BlockEntityType;

/**
 * Each loader constructs and registers its own {@code BlockEntityType}
 * instance (registration timing genuinely differs -- Fabric registers
 * eagerly, NeoForge/Forge defer to a {@code RegisterEvent}), so this is a
 * thin accessor delegating to whichever loader's own registration class is
 * active, mirroring {@code SmartMC.createPlatformInstance()}'s pattern.
 */
public final class ModBlockEntities {

	private ModBlockEntities() {
	}

	public static BlockEntityType<SmartControllerBlockEntity> smartController() {
		//? fabric {
		return com.smartmc.platform.fabric.FabricBlocks.SMART_CONTROLLER_ENTITY;
		//?} else if neoforge {
		/*return com.smartmc.platform.neoforge.NeoforgeBlocks.SMART_CONTROLLER_ENTITY.get();
		*///?} else {
		/*return com.smartmc.platform.forge.ForgeBlocks.SMART_CONTROLLER_ENTITY.get();
		*///?}
	}
}
