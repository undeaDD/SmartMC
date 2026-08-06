package com.smartmc.network;

import com.google.gson.JsonObject;

/**
 * One implementation per message {@code type} in the envelope's dispatch
 * table (see {@link SmartMcMessageHandler}). Adding a new message type means
 * writing one new implementation and adding it to that table -- the router
 * itself never changes.
 */
@FunctionalInterface
public interface MessageHandler {

	/** @return the response to send back wrapped in a new envelope, or {@code null} for no reply */
	OutgoingMessage handle(JsonObject payload, MessageContext context);
}
