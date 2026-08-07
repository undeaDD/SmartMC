package com.smartmc.platform.neoforge;

//? neoforge {

/*import com.smartmc.SmartMC;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.registries.DeferredBlock;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredItem;
import net.neoforged.neoforge.registries.DeferredRegister;

public final class NeoforgeBlocks {

	private static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks(SmartMC.MOD_ID);
	private static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(SmartMC.MOD_ID);
	private static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
		DeferredRegister.create(BuiltInRegistries.BLOCK_ENTITY_TYPE, SmartMC.MOD_ID);
	private static final DeferredRegister<CreativeModeTab> TABS =
		DeferredRegister.create(Registries.CREATIVE_MODE_TAB, SmartMC.MOD_ID);

	public static final DeferredBlock<SmartControllerBlock> SMART_CONTROLLER =
		BLOCKS.registerBlock("smart_controller", SmartControllerBlock::new, SmartControllerBlock.createProperties());
	public static final DeferredItem<BlockItem> SMART_CONTROLLER_ITEM =
		ITEMS.registerSimpleBlockItem("smart_controller", SMART_CONTROLLER, new Item.Properties());
	public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<SmartControllerBlockEntity>> SMART_CONTROLLER_ENTITY =
		BLOCK_ENTITIES.register("smart_controller",
			() -> BlockEntityType.Builder.of(SmartControllerBlockEntity::new, SMART_CONTROLLER.get()).build(null));

	// Futureproofed for when this mod has more than one item -- currently
	// lists exactly the one real item, but output.accept(...) is additive,
	// so a future item just needs one more line here, not a redesign.
	public static final DeferredHolder<CreativeModeTab, CreativeModeTab> TAB = TABS.register("smart_mc", () -> CreativeModeTab.builder()
		.title(Component.translatable("itemGroup.smartmc"))
		.icon(() -> new ItemStack(SMART_CONTROLLER_ITEM.get()))
		.displayItems((params, output) -> output.accept(SMART_CONTROLLER_ITEM.get()))
		.build());

	private NeoforgeBlocks() {
	}

	public static void register(IEventBus modEventBus) {
		BLOCKS.register(modEventBus);
		ITEMS.register(modEventBus);
		BLOCK_ENTITIES.register(modEventBus);
		TABS.register(modEventBus);
	}
}
*///?}
