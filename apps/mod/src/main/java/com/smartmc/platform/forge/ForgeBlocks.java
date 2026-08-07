package com.smartmc.platform.forge;

//? forge {

/*import com.smartmc.SmartMC;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
*///?}
//? forge && > 1.19.2 {
/*import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
*///?}

//? forge {
/*public final class ForgeBlocks {

	private static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, SmartMC.MOD_ID);
	private static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, SmartMC.MOD_ID);
	private static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
		DeferredRegister.create(ForgeRegistries.BLOCK_ENTITY_TYPES, SmartMC.MOD_ID);

	public static final RegistryObject<SmartControllerBlock> SMART_CONTROLLER =
		BLOCKS.register("smart_controller", () -> new SmartControllerBlock(SmartControllerBlock.createProperties()));
*///?}

//? forge && > 1.19.2 {
/*private static final DeferredRegister<CreativeModeTab> TABS = DeferredRegister.create(Registries.CREATIVE_MODE_TAB, SmartMC.MOD_ID);

	public static final RegistryObject<BlockItem> SMART_CONTROLLER_ITEM =
		ITEMS.register("smart_controller", () -> new BlockItem(SMART_CONTROLLER.get(), new Item.Properties()));

	// Futureproofed for when this mod has more than one item -- currently
	// lists exactly the one real item, but output.accept(...) is additive,
	// so a future item just needs one more line here, not a redesign.
	public static final RegistryObject<CreativeModeTab> TAB = TABS.register("smart_mc", () -> CreativeModeTab.builder()
		.title(Component.translatable("itemGroup.smartmc"))
		.icon(() -> new ItemStack(SMART_CONTROLLER_ITEM.get()))
		.displayItems((params, output) -> output.accept(SMART_CONTROLLER_ITEM.get()))
		.build());
*///?}
//? forge && <= 1.19.2 {
/*// 1.19.2 predates the builder-based CreativeModeTab API entirely
	// (confirmed via real 1.19.2-targeting mod source, not assumed) --
	// the old subclass form instead, with each item declaring its tab via
	// Item.Properties#tab rather than the tab pulling its own contents.
	public static final CreativeModeTab TAB = new CreativeModeTab(SmartMC.MOD_ID) {
		@Override
		public ItemStack makeIcon() {
			return new ItemStack(SMART_CONTROLLER_ITEM.get());
		}
	};

	public static final RegistryObject<BlockItem> SMART_CONTROLLER_ITEM =
		ITEMS.register("smart_controller", () -> new BlockItem(SMART_CONTROLLER.get(), new Item.Properties().tab(TAB)));
*///?}

//? forge {
/*public static final RegistryObject<BlockEntityType<SmartControllerBlockEntity>> SMART_CONTROLLER_ENTITY =
		BLOCK_ENTITIES.register("smart_controller",
			() -> BlockEntityType.Builder.of(SmartControllerBlockEntity::new, SMART_CONTROLLER.get()).build(null));

	private ForgeBlocks() {
	}

	public static void register(IEventBus modEventBus) {
		BLOCKS.register(modEventBus);
		ITEMS.register(modEventBus);
		BLOCK_ENTITIES.register(modEventBus);
*///?}
//? forge && > 1.19.2 {
/*		TABS.register(modEventBus);
*///?}
//? forge {
/*	}
}
*///?}
