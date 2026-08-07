package com.smartmc.network;

import com.google.gson.JsonObject;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

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

	/**
	 * Default wraps {@link #handle} for handlers that answer synchronously
	 * (pure DB/crypto work, off the Netty thread is fine either way).
	 * Handlers that need to touch actual world/block state -- which must
	 * happen on the server's main thread, never the Netty event loop --
	 * override this instead and hop via {@code MessageContext.server().execute(...)}.
	 * {@link SmartMcMessageHandler} always calls this one, never {@link #handle} directly.
	 */
	default CompletionStage<OutgoingMessage> handleAsync(JsonObject payload, MessageContext context) {
		return CompletableFuture.completedFuture(handle(payload, context));
	}
}
