package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.PairRequest;
import com.smartmc.protocol.PairResponse;
import com.smartmc.storage.SessionRecord;

import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handles the {@code "pair"} message type: the app submits an in-game pairing
 * code, the mod verifies it and issues a real auth token. Moved verbatim
 * (aside from the envelope wiring) from the old standalone {@code PairingMessageHandler}
 * once {@link com.smartmc.network.SmartMcMessageHandler} generalized dispatch
 * to support more than one message type.
 */
public class PairMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		PairRequest request = GSON.fromJson(payload, PairRequest.class);
		if (request == null || request.getPairingCode() == null || request.getDeviceName() == null) {
			throw new IllegalArgumentException("Malformed PairRequest");
		}

		return new OutgoingMessage("pair", handlePairing(request, context));
	}

	private PairResponse handlePairing(PairRequest request, MessageContext context) {
		Optional<UUID> playerUuid = context.pairingCodes().consume(request.getPairingCode());
		if (playerUuid.isEmpty()) {
			PairResponse response = new PairResponse();
			response.setSuccess(false);
			response.setError("Invalid or expired pairing code");
			return response;
		}

		String deviceId = UUID.randomUUID().toString();
		List<String> groupIds = context.groupProvider().findGroupsForPlayer(playerUuid.get()).stream()
			.map(group -> group.id())
			.collect(Collectors.toList());
		TokenService.IssuedToken issued = context.tokens().issue(playerUuid.get(), groupIds, deviceId, context.tokenValidity());

		try {
			context.sessions().insert(new SessionRecord(
				issued.jti(), playerUuid.get(), deviceId, request.getDeviceName(),
				Instant.now().getEpochSecond(), false));
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to persist session for {}", playerUuid.get(), e);
			PairResponse response = new PairResponse();
			response.setSuccess(false);
			response.setError("Server error while pairing -- try again");
			return response;
		}

		PairResponse response = new PairResponse();
		response.setSuccess(true);
		response.setToken(issued.token());
		response.setPlayerUuid(playerUuid.get().toString());
		return response;
	}
}
