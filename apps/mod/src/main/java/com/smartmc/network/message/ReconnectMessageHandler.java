package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.ReconnectRequest;
import com.smartmc.protocol.ReconnectResponse;
import com.smartmc.storage.SessionRecord;

import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handles the {@code "reconnect"} message type: the app presents a
 * previously-issued token instead of re-pairing. On success this performs a
 * sliding-window rotation -- a fresh token is always issued (new {@code jti},
 * new expiry), so a device that reconnects at least once within
 * {@code tokenExpirySeconds} never actually hits expiry in practice. Group
 * membership is re-read here too (not just at pairing time), since it may
 * have changed since the last connection.
 */
public class ReconnectMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		ReconnectRequest request = GSON.fromJson(payload, ReconnectRequest.class);
		if (request == null || request.getToken() == null) {
			throw new IllegalArgumentException("Malformed ReconnectRequest");
		}

		return new OutgoingMessage("reconnect", handleReconnect(request, context));
	}

	private ReconnectResponse handleReconnect(ReconnectRequest request, MessageContext context) {
		Optional<TokenService.TokenPayload> verified = context.tokens().verify(request.getToken());
		if (verified.isEmpty()) {
			return failure("Token invalid or expired -- run /smartmc pair again");
		}
		TokenService.TokenPayload claims = verified.get();

		Optional<SessionRecord> session;
		try {
			session = context.sessions().findByJti(claims.jti());
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to look up session {}", claims.jti(), e);
			return failure("Server error while reconnecting -- try again");
		}
		if (session.isEmpty() || session.get().revoked()) {
			return failure("This session was revoked -- run /smartmc pair again");
		}

		UUID playerUuid = UUID.fromString(claims.sub());
		List<String> groupIds = context.groupProvider().findGroupsForPlayer(playerUuid).stream()
			.map(group -> group.id())
			.collect(Collectors.toList());
		TokenService.IssuedToken issued = context.tokens().issue(
			playerUuid, groupIds, session.get().deviceId(), context.tokenValidity());

		try {
			context.sessions().rotate(claims.jti(), issued.jti(), Instant.now().getEpochSecond());
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to rotate session {}", claims.jti(), e);
			return failure("Server error while reconnecting -- try again");
		}

		ReconnectResponse response = new ReconnectResponse();
		response.setSuccess(true);
		response.setToken(issued.token());
		response.setPlayerUuid(claims.sub());
		return response;
	}

	private static ReconnectResponse failure(String error) {
		ReconnectResponse response = new ReconnectResponse();
		response.setSuccess(false);
		response.setError(error);
		return response;
	}
}
