package com.smartmc.platform.forge;

//? forge {

/*import com.smartmc.SmartMC;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public final class ForgeBlocks {

	private static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, SmartMC.MOD_ID);
	private static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, SmartMC.MOD_ID);
	private static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
		DeferredRegister.create(ForgeRegistries.BLOCK_ENTITY_TYPES, SmartMC.MOD_ID);

	public static final RegistryObject<SmartControllerBlock> SMART_CONTROLLER =
		BLOCKS.register("smart_controller", () -> new SmartControllerBlock(SmartControllerBlock.createProperties()));
	public static final RegistryObject<BlockItem> SMART_CONTROLLER_ITEM =
		ITEMS.register("smart_controller", () -> new BlockItem(SMART_CONTROLLER.get(), new Item.Properties()));
	public static final RegistryObject<BlockEntityType<SmartControllerBlockEntity>> SMART_CONTROLLER_ENTITY =
		BLOCK_ENTITIES.register("smart_controller",
			() -> BlockEntityType.Builder.of(SmartControllerBlockEntity::new, SMART_CONTROLLER.get()).build(null));

	private ForgeBlocks() {
	}

	public static void register(IEventBus modEventBus) {
		BLOCKS.register(modEventBus);
		ITEMS.register(modEventBus);
		BLOCK_ENTITIES.register(modEventBus);
	}
}
*///?}
