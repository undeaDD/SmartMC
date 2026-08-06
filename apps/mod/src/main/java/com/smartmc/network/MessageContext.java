package com.smartmc.network;

import com.smartmc.auth.PairingCodeManager;
import com.smartmc.auth.TokenService;
import com.smartmc.group.GroupProvider;
import com.smartmc.storage.SessionStore;

import java.time.Duration;

/**
 * Everything a {@link MessageHandler} might need, bundled so adding a new
 * dependency (e.g. a device store for a future M5 message type) means
 * changing this one record, not every constructor between {@link MagicBytePeekDecoder}
 * (the sole place that reaches into {@code SmartMC}'s statics to build this)
 * and the handler that actually uses it.
 */
public record MessageContext(
	PairingCodeManager pairingCodes,
	TokenService tokens,
	SessionStore sessions,
	GroupProvider groupProvider,
	Duration tokenValidity
) {
}
