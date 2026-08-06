package com.smartmc.network;

/** A {@link MessageHandler}'s reply, before it's wrapped in an outgoing envelope by {@link SmartMcMessageHandler}. */
public record OutgoingMessage(String type, Object payload) {
}
