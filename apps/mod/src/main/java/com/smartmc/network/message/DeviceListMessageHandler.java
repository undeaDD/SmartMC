package com.smartmc.network.message;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmc.SmartMC;
import com.smartmc.auth.TokenService;
import com.smartmc.network.MessageContext;
import com.smartmc.network.MessageHandler;
import com.smartmc.network.OutgoingMessage;
import com.smartmc.protocol.DeviceListRequest;
import com.smartmc.protocol.DeviceListResponse;
import com.smartmc.protocol.DeviceSummary;
import com.smartmc.storage.DeviceRecord;
import com.smartmc.storage.SessionRecord;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
 */
public class DeviceListMessageHandler implements MessageHandler {

	private static final Gson GSON = new Gson();

	@Override
	public OutgoingMessage handle(JsonObject payload, MessageContext context) {
		DeviceListRequest request = GSON.fromJson(payload, DeviceListRequest.class);
		if (request == null || request.getToken() == null) {
			throw new IllegalArgumentException("Malformed DeviceListRequest");
		}

		return new OutgoingMessage("devices", handleList(request, context));
	}

	private DeviceListResponse handleList(DeviceListRequest request, MessageContext context) {
		Optional<TokenService.TokenPayload> verified = context.tokens().verify(request.getToken());
		if (verified.isEmpty()) {
			return failure("Token invalid or expired -- run /smartmc pair again");
		}
		TokenService.TokenPayload claims = verified.get();

		try {
			Optional<SessionRecord> session = context.sessions().findByJti(claims.jti());
			if (session.isEmpty() || session.get().revoked()) {
				return failure("This session was revoked -- run /smartmc pair again");
			}

			List<DeviceSummary> devices = context.devices().findByOwner(UUID.fromString(claims.sub())).stream()
				.map(DeviceListMessageHandler::toSummary)
				.collect(Collectors.toList());

			DeviceListResponse response = new DeviceListResponse();
			response.setSuccess(true);
			response.setDevices(devices);
			return response;
		} catch (SQLException e) {
			SmartMC.LOGGER.error("Failed to list devices for {}", claims.sub(), e);
			return failure("Server error while listing devices -- try again");
		}
	}

	private static DeviceSummary toSummary(DeviceRecord device) {
		DeviceSummary summary = new DeviceSummary();
		summary.setId(device.id());
		summary.setType(device.type());
		summary.setLabel(device.label());
		if (device.groupId() != null) {
			summary.setGroupId(device.groupId());
		}
		return summary;
	}

	private static DeviceListResponse failure(String error) {
		DeviceListResponse response = new DeviceListResponse();
		response.setSuccess(false);
		response.setError(error);
		return response;
	}
}
