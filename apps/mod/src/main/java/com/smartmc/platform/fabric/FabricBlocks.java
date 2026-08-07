package com.smartmc.platform.fabric;

//? fabric {

import com.smartmc.SmartMC;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.entity.BlockEntityType;

public final class FabricBlocks {

	private static final ResourceLocation ID = ResourceLocation.fromNamespaceAndPath(SmartMC.MOD_ID, "smart_controller");

	public static final SmartControllerBlock SMART_CONTROLLER = new SmartControllerBlock(SmartControllerBlock.createProperties());
	public static final BlockItem SMART_CONTROLLER_ITEM = new BlockItem(SMART_CONTROLLER, new Item.Properties());
	public static final BlockEntityType<SmartControllerBlockEntity> SMART_CONTROLLER_ENTITY =
		BlockEntityType.Builder.of(SmartControllerBlockEntity::new, SMART_CONTROLLER).build(null);

	private FabricBlocks() {
	}

	public static void register() {
		Registry.register(BuiltInRegistries.BLOCK, ID, SMART_CONTROLLER);
		Registry.register(BuiltInRegistries.ITEM, ID, SMART_CONTROLLER_ITEM);
		Registry.register(BuiltInRegistries.BLOCK_ENTITY_TYPE, ID, SMART_CONTROLLER_ENTITY);
		registerCreativeTab();
	}

	/**
	 * Futureproofed for when this mod has more than one item -- currently
	 * lists exactly the one real item, but {@code output.accept(...)} is
	 * additive, so a future item just needs one more line here, not a
	 * redesign.
	 */
	private static void registerCreativeTab() {
		ResourceLocation tabId = ResourceLocation.fromNamespaceAndPath(SmartMC.MOD_ID, "smart_mc");
		Registry.register(BuiltInRegistries.CREATIVE_MODE_TAB, tabId, FabricItemGroup.builder()
			.title(Component.translatable("itemGroup.smartmc"))
			.icon(() -> new ItemStack(SMART_CONTROLLER_ITEM))
			.displayItems((params, output) -> output.accept(SMART_CONTROLLER_ITEM))
			.build());
	}
}
//?}
