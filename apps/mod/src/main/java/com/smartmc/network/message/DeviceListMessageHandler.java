package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.block.SmartControllerBlock;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.DeviceListRequest;
import com.smartmc.protocol.DeviceListResponse;
import com.smartmc.protocol.DeviceSummary;
import com.smartmc.storage.DeviceRecord;
import com.smartmc.storage.SessionRecord;
import net.minecraft.core.BlockPos;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.stream.Collectors;

//? > 1.19.2 {
import net.minecraft.core.registries.Registries;
//?}

/**
 * Handles the {@code "devices"} message type: same bearer-token
 * authentication as {@link ReconnectMessageHandler} (verify signature/expiry,
 * then confirm the session hasn't been revoked), then returns the devices
 * the requesting player owns. <b>v1 scope, per explicit direction</b>: owned
 * devices only -- {@code DeviceStore} has no group-membership query yet, so
 * devices shared via a group but owned by someone else don't show up here.
 * That's a real, known gap (not the deliberately-generic unauthorized
 * response from the Security model -- this is a client-visibility gap, not
 * an authorization bypass), left for a follow-up once {@code DeviceStore}
 * grows a {@code findByGroupIds} method.
 *
 * <p>Also the mod's second handler needing real world access (after
 * {@code DeviceToggleMessageHandler}): a {@code switch} device's
 * {@code powered} field is read from its actual live blockstate, not just
 * the static {@code DeviceRecord}, since the app has no other way to learn
 * the device's real on/off state on a plain list fetch -- see
 * {@link MessageHandler#handleAsync}.
 */
public class DeviceListMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		throw new UnsupportedOperationException("DeviceListMessageHandler is async-only -- see handleAsync");
	}

	@Override
	public CompletionStage<OutgoingMessage> handleAsync(JsonObject payload, MessageContext context) {
		DeviceListRequest request = GSON.fromJson(payload, DeviceListRequest.class);
		if (request == null || request.getToken() == null) {
			throw new IllegalArgumentException("Malformed DeviceListRequest");
		}

		Optional<TokenService.TokenPayload> verified = context.tokens().verify(request.getToken());
		if (verified.isEmpty()) {
			return reply(failure("Token invalid or expired -- run /smartmc pair again"));
		}
		TokenService.TokenPayload claims = verified.get();

		List<DeviceRecord> owned;
		try {
			Optional<SessionRecord> session = context.sessions().findByJti(claims.jti());
			if (session.isEmpty() || session.get().revoked()) {
				return reply(failure("This session was revoked -- run /smartmc pair again"));
			}
			owned = context.devices().findByOwner(UUID.fromString(claims.sub()));
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to list devices for {}", claims.sub(), e);
			return reply(failure("Server error while listing devices -- try again"));
		}

		CompletableFuture<OutgoingMessage> future = new CompletableFuture<>();
		context.server().execute(() -> {
			DeviceListResponse response = new DeviceListResponse();
			response.setSuccess(true);
			response.setDevices(owned.stream()
				.map(device -> toSummary(device, context))
				.collect(Collectors.toList()));
			future.complete(new OutgoingMessage("devices", response));
		});
		return future;
	}

	/** Must only ever run on the server's main thread -- see {@link #handleAsync}. */
	private static DeviceSummary toSummary(DeviceRecord device, MessageContext context) {
		DeviceSummary summary = new DeviceSummary();
		summary.setId(device.id());
		summary.setType(device.type());
		summary.setLabel(device.label());
		if (device.groupId() != null) {
			summary.setGroupId(device.groupId());
		}
		if ("switch".equals(device.type())) {
			readPowered(device, context).ifPresent(summary::setPowered);
		}
		return summary;
	}

	private static Optional<Boolean> readPowered(DeviceRecord device, MessageContext context) {
		//? > 1.19.2 {
		ResourceLocation dimensionId = ResourceLocation.parse(device.dimension());
		ResourceKey<net.minecraft.world.level.Level> dimensionKey = ResourceKey.create(Registries.DIMENSION, dimensionId);
		//?} else {
		/*ResourceLocation dimensionId = new ResourceLocation(device.dimension());
		ResourceKey<net.minecraft.world.level.Level> dimensionKey = ResourceKey.create(net.minecraft.core.Registry.DIMENSION_REGISTRY, dimensionId);
		*///?}

		ServerLevel level = ((MinecraftServer) context.server()).getLevel(dimensionKey);
		if (level == null) {
			return Optional.empty();
		}
		BlockPos pos = new BlockPos(device.x(), device.y(), device.z());
		if (!level.isLoaded(pos)) {
			return Optional.empty();
		}
		net.minecraft.world.level.block.state.BlockState state = level.getBlockState(pos);
		if (!(state.getBlock() instanceof SmartControllerBlock)) {
			return Optional.empty();
		}
		return Optional.of(state.getValue(SmartControllerBlock.POWERED));
	}

	private static CompletionStage<OutgoingMessage> reply(DeviceListResponse response) {
		return CompletableFuture.completedFuture(new OutgoingMessage("devices", response));
	}

	private static DeviceListResponse failure(String error) {
		DeviceListResponse response = new DeviceListResponse();
		response.setSuccess(false);
		response.setError(error);
		return response;
	}
}
