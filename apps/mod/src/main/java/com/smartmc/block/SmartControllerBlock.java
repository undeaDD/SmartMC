package com.smartmc.block;

import com.smartmc.SmartMC;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.EntityBlock;
import net.minecraft.world.level.block.HorizontalDirectionalBlock;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.BooleanProperty;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;
import net.minecraft.world.item.context.BlockPlaceContext;

import java.sql.SQLException;

/**
 * Placed and shaped exactly like vanilla's {@code RepeaterBlock} (thin plate,
 * {@code FACING} chosen by the placer's look direction, faces away from the
 * player) but deliberately does NOT extend {@code DiodeBlock} -- that base
 * class carries tick-delay scheduling and lock-state logic this block has no
 * use for (right-click always opens the device GUI instead of cycling a
 * delay). {@code FACING} is the input side, {@code FACING.getOpposite()} the
 * output -- but unlike a repeater/diode, input does NOT drive output here:
 * this is a controlled device, not a wire. {@link #POWERED} (the device's
 * on/off state, and which texture variant renders) is set only by the app
 * (see {@code DeviceToggleMessageHandler}) and, later, per-device-type logic
 * -- see {@link #neighborChanged}'s javadoc for why an earlier version that
 * mirrored input straight to output was wrong. See CLAUDE.md's Device/alarm
 * model section for why one block generalizes the original single-purpose
 * alarm-trigger design.
 *
 * <p>Persists a {@code DeviceRecord} on placement and removes it on break
 * (see {@link #setPlacedBy}/{@link #onRemove}) with hardcoded v1 defaults --
 * no in-world GUI yet, see {@link SmartControllerBlockEntity}'s javadoc.
 * Not yet wired to the app-facing network/notification pipeline; see the
 * follow-up work tracked against M5 in CLAUDE.md.
 */
public class SmartControllerBlock extends HorizontalDirectionalBlock implements EntityBlock {

	public static final BooleanProperty POWERED = BlockStateProperties.POWERED;

	private static final VoxelShape SHAPE = Block.box(0, 0, 0, 16, 2, 16);

	/**
	 * A fresh {@link BlockBehaviour.Properties} per call, not a shared
	 * constant -- NeoForge's own {@code DeferredRegister} docs explicitly
	 * call for factories that produce new instances each time they're
	 * invoked, and each loader's registration owns its own construction
	 * (see {@code platform/{fabric,neoforge,forge}/*Blocks.java}).
	 */
	public static BlockBehaviour.Properties createProperties() {
		//? > 1.19.2 {
		return BlockBehaviour.Properties.of()
			.mapColor(net.minecraft.world.level.material.MapColor.STONE)
			.sound(net.minecraft.world.level.block.SoundType.STONE)
			.strength(2.0f, 6.0f)
			.noOcclusion();
		//?} else {
		/*return BlockBehaviour.Properties.of(net.minecraft.world.level.material.Material.STONE)
			.sound(net.minecraft.world.level.block.SoundType.STONE)
			.strength(2.0f, 6.0f)
			.noOcclusion();
		*///?}
	}

	public SmartControllerBlock(BlockBehaviour.Properties properties) {
		super(properties);
		this.registerDefaultState(this.stateDefinition.any()
			.setValue(FACING, Direction.NORTH)
			.setValue(POWERED, false));
	}

	//? >= 1.20.5 {
	private static final com.mojang.serialization.MapCodec<SmartControllerBlock> CODEC = simpleCodec(SmartControllerBlock::new);

	@Override
	protected com.mojang.serialization.MapCodec<SmartControllerBlock> codec() {
		return CODEC;
	}
	//?}

	@Override
	protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
		builder.add(FACING, POWERED);
	}

	@Override
	public BlockState getStateForPlacement(BlockPlaceContext context) {
		return this.defaultBlockState()
			.setValue(FACING, context.getHorizontalDirection().getOpposite())
			.setValue(POWERED, false);
	}

	@Override
	public VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context) {
		return SHAPE;
	}

	@Override
	public boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {
		return level.getBlockState(pos.below()).isFaceSturdy(level, pos.below(), Direction.UP);
	}

	@Override
	public boolean isSignalSource(BlockState state) {
		return true;
	}

	@Override
	public int getSignal(BlockState state, BlockGetter level, BlockPos pos, Direction direction) {
		if (!state.getValue(POWERED)) {
			return 0;
		}
		return state.getValue(FACING) == direction ? 15 : 0;
	}

	@Override
	public int getDirectSignal(BlockState state, BlockGetter level, BlockPos pos, Direction direction) {
		return getSignal(state, level, pos, direction);
	}

	/**
	 * Deliberately does NOT slave {@link #POWERED} to the raw input reading
	 * -- an earlier version did, and it was wrong on three counts the user
	 * found live: (1) {@code POWERED} is this device's OUTPUT/on-off state,
	 * controlled by the app (see {@code DeviceToggleMessageHandler}) and,
	 * later, per-device-type logic (e.g. an armed alarm reacting to a
	 * trigger) -- it must never be a plain mirror of the physical input, or
	 * literally any neighbor-changed event (including the block's own
	 * app-driven state change notifying its neighbors) immediately
	 * re-syncs it back to the physical input and undoes whatever just set
	 * it; (2) that made the block behave like a bare wire -- input
	 * physically "passing through" to output -- instead of a controlled
	 * device with its own state; (3) it made the tile's on/off texture
	 * track raw input instead of the device's actual state.
	 *
	 * <p>{@link #FACING} is confirmed the INPUT side for this block family
	 * (see the class javadoc history / CLAUDE.md), kept here as the
	 * documented anchor for whichever device-type-specific input reaction
	 * lands later (e.g. an armed {@code ALARM} triggering on a rising edge)
	 * -- there is no such reaction yet, so this is intentionally a no-op
	 * for now rather than guessing one.
	 */
	@Override
	public void neighborChanged(BlockState state, Level level, BlockPos pos, Block neighborBlock, BlockPos neighborPos, boolean movedByPiston) {
	}

	@Override
	public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
		return new SmartControllerBlockEntity(pos, state);
	}

	/** Records the placing player as owner and persists the new device -- see CLAUDE.md's Device/alarm model section. */
	@Override
	public void setPlacedBy(Level level, BlockPos pos, BlockState state, LivingEntity placer, ItemStack stack) {
		super.setPlacedBy(level, pos, state, placer, stack);
		if (level.isClientSide || !(level.getBlockEntity(pos) instanceof SmartControllerBlockEntity blockEntity)) {
			return;
		}
		blockEntity.setOwnerUuid(placer != null ? placer.getUUID() : null);
		try {
			SmartMC.devices().insert(blockEntity.toDeviceRecord());
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to persist new device at {}", pos, e);
		}
	}

	/** Removes the device record once the block itself (not just its state) is actually gone. */
	@Override
	public void onRemove(BlockState state, Level level, BlockPos pos, BlockState newState, boolean movedByPiston) {
		if (!level.isClientSide && !state.is(newState.getBlock())
			&& level.getBlockEntity(pos) instanceof SmartControllerBlockEntity blockEntity) {
			try {
				SmartMC.devices().delete(blockEntity.deviceId().toString());
			} catch (SQLException e) {
				SmartMC.LOGGER.error("Failed to remove device record for {}", blockEntity.deviceId(), e);
			}
		}
		super.onRemove(state, level, pos, newState, movedByPiston);
	}
}
