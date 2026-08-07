package com.smartmc.platform.neoforge;

//? neoforge {

/*import com.smartmc.SmartMC;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
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

	public static final DeferredBlock<SmartControllerBlock> SMART_CONTROLLER =
		BLOCKS.registerBlock("smart_controller", SmartControllerBlock::new, SmartControllerBlock.createProperties());
	public static final DeferredItem<BlockItem> SMART_CONTROLLER_ITEM =
		ITEMS.registerSimpleBlockItem("smart_controller", SMART_CONTROLLER, new Item.Properties());
	public static final DeferredHolder<BlockEntityType<?>, BlockEntityType<SmartControllerBlockEntity>> SMART_CONTROLLER_ENTITY =
		BLOCK_ENTITIES.register("smart_controller",
			() -> BlockEntityType.Builder.of(SmartControllerBlockEntity::new, SMART_CONTROLLER.get()).build(null));

	private NeoforgeBlocks() {
	}

	public static void register(IEventBus modEventBus) {
		BLOCKS.register(modEventBus);
		ITEMS.register(modEventBus);
		BLOCK_ENTITIES.register(modEventBus);
	}
}
*///?}
