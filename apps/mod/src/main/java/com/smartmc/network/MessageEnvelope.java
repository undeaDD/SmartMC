package com.smartmc.network;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.Optional;

/**
 * Encodes/decodes the {@code {type, payload}} envelope every message on the
 * post-handshake tunnel is wrapped in (see {@code packages/protocol/schema/envelope.tsp}
 * for the shared shape). {@code payload} is deliberately untyped at the
 * schema level -- Gson can't statically deserialize a generic {@code Object}
 * field into the right concrete class, so decoding hands back the raw
 * {@link JsonObject} for the caller (a {@link MessageHandler}) to parse into
 * whichever type its own message type expects.
 */
public final class MessageEnvelope {

	private MessageEnvelope() {
	}

	public static String encode(Gson gson, String type, Object payload) {
		JsonObject envelope = new JsonObject();
		envelope.addProperty("type", type);
		envelope.add("payload", gson.toJsonTree(payload));
		return gson.toJson(envelope);
	}

	public record Decoded(String type, JsonObject payload) {
	}

	/** Empty on any malformed input -- callers should treat that as a protocol violation. */
	public static Optional<Decoded> decode(Gson gson, String message) {
		try {
			JsonObject envelope = JsonParser.parseString(message).getAsJsonObject();
			String type = envelope.get("type").getAsString();
			JsonObject payload = envelope.getAsJsonObject("payload");
			if (payload == null) {
				return Optional.empty();
			}
			return Optional.of(new Decoded(type, payload));
		} catch (RuntimeException e) {
			return Optional.empty();
		}
	}
}
