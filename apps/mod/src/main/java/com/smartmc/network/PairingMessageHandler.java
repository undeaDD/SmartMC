package com.smartmc.network;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.smartmc.SmartMC;
import com.smartmc.auth.PairingCodeManager;
import com.smartmc.auth.TokenService;
import com.smartmc.protocol.PairRequest;
import com.smartmc.protocol.PairResponse;
import com.smartmc.storage.SessionRecord;
import com.smartmc.storage.SessionStore;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Terminal handler installed by {@link NoiseHandshakeHandler} once the Noise
 * tunnel is up -- replaces M1's {@code FramedJsonEchoHandler} now that there's
 * a real message to handle. For this slice, the only message the app ever
 * sends over a fresh connection is a {@link PairRequest}; there's no envelope
 * discriminating message types yet since pairing is the only one that exists
 * (a future slice adding device commands on the same tunnel will need one).
 *
 * <p>Dependencies are injected rather than pulled from {@link SmartMC}'s
 * statics directly, matching {@link NoiseHandshakeHandler}'s own constructor
 * (which takes its keypair as a parameter) -- keeps this handler testable
 * without spinning up the full server lifecycle.
 */
public class PairingMessageHandler extends SimpleChannelInboundHandler<String> {

	private static final Gson GSON = new Gson();

	private final PairingCodeManager pairingCodes;
	private final TokenService tokens;
	private final SessionStore sessions;
	private final Duration tokenValidity;

	public PairingMessageHandler(PairingCodeManager pairingCodes, TokenService tokens, SessionStore sessions, Duration tokenValidity) {
		this.pairingCodes = pairingCodes;
		this.tokens = tokens;
		this.sessions = sessions;
		this.tokenValidity = tokenValidity;
	}

	@Override
	protected void channelRead0(ChannelHandlerContext ctx, String msg) {
		PairRequest request;
		try {
			request = GSON.fromJson(msg, PairRequest.class);
		} catch (JsonSyntaxException e) {
			SmartMC.LOGGER.warn("Malformed message from {}, closing connection", ctx.channel().remoteAddress());
			ctx.close();
			return;
		}
		if (request == null || request.getPairingCode() == null || request.getDeviceName() == null) {
			SmartMC.LOGGER.warn("Malformed PairRequest from {}, closing connection", ctx.channel().remoteAddress());
			ctx.close();
			return;
		}

		ctx.writeAndFlush(GSON.toJson(handlePairing(request)));
	}

	private PairResponse handlePairing(PairRequest request) {
		Optional<UUID> playerUuid = pairingCodes.consume(request.getPairingCode());
		if (playerUuid.isEmpty()) {
			PairResponse response = new PairResponse();
			response.setSuccess(false);
			response.setError("Invalid or expired pairing code");
			return response;
		}

		String deviceId = UUID.randomUUID().toString();
		TokenService.IssuedToken issued = tokens.issue(playerUuid.get(), List.of(), deviceId, tokenValidity);

		try {
			sessions.insert(new SessionRecord(
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
