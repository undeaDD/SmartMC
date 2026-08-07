package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.ServerIconRequest;
import com.smartmc.protocol.ServerIconResponse;
import com.smartmc.storage.SessionRecord;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.Base64;
import java.util.Optional;

/**
 * Handles the {@code "server_icon"} message type: same bearer-token
 * authentication as {@link ReconnectMessageHandler}/{@link DeviceListMessageHandler}
 * (verify signature/expiry, then confirm the session hasn't been revoked),
 * then reads {@code server-icon.png} from the server's own game directory --
 * the exact same file vanilla itself reads for the multiplayer server-list
 * favicon, not a separate SmartMC-specific asset. Plain file I/O, no
 * per-Minecraft-version API risk (unlike reflecting into vanilla's own
 * favicon cache, which changed shape around 1.19.4's move to a record-based
 * {@code ServerStatus}) -- reading the same well-known filename directly
 * from {@link MessageContext#gameDir()} works identically across every
 * supported version/loader.
 *
 * <p>A missing icon is a normal, non-error case (not every operator sets
 * one) -- {@code success: true} with {@code imageBase64} simply absent, so
 * the app falls back to its own generic icon rather than showing an error.
 */
public class ServerIconMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();
	private static final String ICON_FILE_NAME = "server-icon.png";

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		ServerIconRequest request = GSON.fromJson(payload, ServerIconRequest.class);
		if (request == null || request.getToken() == null) {
			throw new IllegalArgumentException("Malformed ServerIconRequest");
		}

		return new OutgoingMessage("server_icon", handleRequest(request, context));
	}

	private ServerIconResponse handleRequest(ServerIconRequest request, MessageContext context) {
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
			return failure("Server error while fetching server icon -- try again");
		}
		if (session.isEmpty() || session.get().revoked()) {
			return failure("This session was revoked -- run /smartmc pair again");
		}

		ServerIconResponse response = new ServerIconResponse();
		response.setSuccess(true);

		Path iconPath = context.gameDir().resolve(ICON_FILE_NAME);
		if (Files.isRegularFile(iconPath)) {
			try {
				response.setImageBase64(Base64.getEncoder().encodeToString(Files.readAllBytes(iconPath)));
			} catch (IOException e) {
				SmartMC.LOGGER.warn("Found {} but failed to read it", iconPath, e);
			}
		}
		return response;
	}

	private static ServerIconResponse failure(String error) {
		ServerIconResponse response = new ServerIconResponse();
		response.setSuccess(false);
		response.setError(error);
		return response;
	}
}
