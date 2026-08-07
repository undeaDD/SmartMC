package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.block.SmartControllerBlockEntity;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.DeviceToggleRequest;
import com.smartmc.protocol.DeviceToggleResponse;
import com.smartmc.storage.DeviceRecord;
import net.minecraft.core.BlockPos;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.level.block.state.BlockState;

//? > 1.19.2 {
import net.minecraft.core.registries.Registries;
//?}

import java.sql.SQLException;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

/**
 * Handles the {@code "device_toggle"} message type -- the app's way to flip
 * a {@code SWITCH} device's redstone output. Same bearer-token
 * authenticate-then-authorize shape as {@link DeviceListMessageHandler}, but
 * this one actually touches world/block state, so it's the first handler in
 * this mod that needs {@link MessageHandler#handleAsync}: token/DB checks
 * happen synchronously (cheap, no world access), then the actual toggle is
 * scheduled onto the server's main thread via {@code MessageContext.server().execute(...)}
 * -- Minecraft world state is never safe to touch from a Netty thread.
 */
public class DeviceToggleMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		throw new UnsupportedOperationException("DeviceToggleMessageHandler is async-only -- see handleAsync");
	}

	@Override
	public CompletionStage<OutgoingMessage> handleAsync(JsonObject payload, MessageContext context) {
		DeviceToggleRequest request = GSON.fromJson(payload, DeviceToggleRequest.class);
		if (request == null || request.getToken() == null || request.getDeviceId() == null) {
			throw new IllegalArgumentException("Malformed DeviceToggleRequest");
		}

		Optional<TokenService.TokenPayload> verified = context.tokens().verify(request.getToken());
		if (verified.isEmpty()) {
			return reply(unauthorized());
		}
		TokenService.TokenPayload claims = verified.get();

		DeviceRecord device;
		try {
			Optional<DeviceRecord> found = context.devices().findById(request.getDeviceId());
			if (found.isEmpty()) {
				// Generic, same as "not yours" -- see the Security model's
				// device-ID enumeration note in CLAUDE.md.
				return reply(unauthorized());
			}
			device = found.get();
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to look up device {}", request.getDeviceId(), e);
			return reply(serverError());
		}

		boolean owns = device.ownerUuid() != null && claims.sub().equals(device.ownerUuid().toString());
		boolean groupMember = device.groupId() != null && claims.groups().contains(device.groupId());
		if (!owns && !groupMember) {
			return reply(unauthorized());
		}
		if (!"switch".equals(device.type())) {
			return reply(unsupportedType());
		}

		CompletableFuture<OutgoingMessage> future = new CompletableFuture<>();
		context.server().execute(() -> future.complete(new OutgoingMessage("device_toggle", toggleOnMainThread(device, context))));
		return future;
	}

	/** Must only ever run on the server's main thread -- see {@link #handleAsync}. */
	private DeviceToggleResponse toggleOnMainThread(DeviceRecord device, MessageContext context) {
		//? > 1.19.2 {
		ResourceLocation dimensionId = ResourceLocation.parse(device.dimension());
		ResourceKey<net.minecraft.world.level.Level> dimensionKey = ResourceKey.create(Registries.DIMENSION, dimensionId);
		//?} else {
		/*ResourceLocation dimensionId = new ResourceLocation(device.dimension());
		ResourceKey<net.minecraft.world.level.Level> dimensionKey = ResourceKey.create(net.minecraft.core.Registry.DIMENSION_REGISTRY, dimensionId);
		*///?}

		ServerLevel level = ((MinecraftServer) context.server()).getLevel(dimensionKey);
		if (level == null) {
			return chunkNotLoaded();
		}

		BlockPos pos = new BlockPos(device.x(), device.y(), device.z());
		if (!level.isLoaded(pos)) {
			return chunkNotLoaded();
		}

		if (!(level.getBlockEntity(pos) instanceof SmartControllerBlockEntity blockEntity)
			|| !blockEntity.deviceId().toString().equals(device.id())) {
			removeStaleRecord(device, context);
			return staleReference();
		}

		BlockState state = level.getBlockState(pos);
		boolean newPowered = !state.getValue(SmartControllerBlock.POWERED);
		level.setBlock(pos, state.setValue(SmartControllerBlock.POWERED, newPowered), 3);
		level.updateNeighborsAt(pos.relative(state.getValue(SmartControllerBlock.FACING)), state.getBlock());

		DeviceToggleResponse response = new DeviceToggleResponse();
		response.setSuccess(true);
		response.setPowered(newPowered);
		return response;
	}

	private void removeStaleRecord(DeviceRecord device, MessageContext context) {
		try {
			context.devices().delete(device.id());
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to remove stale device record {}", device.id(), e);
		}
	}

	private static CompletionStage<OutgoingMessage> reply(DeviceToggleResponse response) {
		return CompletableFuture.completedFuture(new OutgoingMessage("device_toggle", response));
	}

	private static DeviceToggleResponse unauthorized() {
		return failure("UNAUTHORIZED", "You don't have access to that device.");
	}

	private static DeviceToggleResponse chunkNotLoaded() {
		return failure("DEVICE_CHUNK_NOT_LOADED", "That device's chunk isn't loaded right now.");
	}

	private static DeviceToggleResponse staleReference() {
		return failure("STALE_REFERENCE", "That device no longer exists.");
	}

	private static DeviceToggleResponse unsupportedType() {
		return failure("UNSUPPORTED_DEVICE_TYPE", "Only switch devices can be toggled.");
	}

	private static DeviceToggleResponse serverError() {
		return failure("SERVER_ERROR", "Server error while toggling that device -- try again.");
	}

	private static DeviceToggleResponse failure(String code, String message) {
		DeviceToggleResponse response = new DeviceToggleResponse();
		response.setSuccess(false);
		response.setErrorCode(code);
		response.setError(message);
		return response;
	}
}
