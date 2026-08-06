package com.smartmc.network;

import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MessageEnvelopeTest {

	private static final Gson GSON = new Gson();

	private record SamplePayload(String foo, int bar) {
	}

	@Test
	void encodeThenDecodeRoundTrips() {
		String json = MessageEnvelope.encode(GSON, "sample", new SamplePayload("hello", 42));

		Optional<MessageEnvelope.Decoded> decoded = MessageEnvelope.decode(GSON, json);

		assertTrue(decoded.isPresent());
		assertEquals("sample", decoded.get().type());
		SamplePayload payload = GSON.fromJson(decoded.get().payload(), SamplePayload.class);
		assertEquals("hello", payload.foo());
		assertEquals(42, payload.bar());
	}

	@Test
	void decodeRejectsNonJsonInput() {
		assertFalse(MessageEnvelope.decode(GSON, "not json at all").isPresent());
	}

	@Test
	void decodeRejectsMissingPayload() {
		assertFalse(MessageEnvelope.decode(GSON, "{\"type\":\"sample\"}").isPresent());
	}

	@Test
	void decodeRejectsMissingType() {
		assertFalse(MessageEnvelope.decode(GSON, "{\"payload\":{}}").isPresent());
	}

	@Test
	void decodeRejectsJsonArrayInput() {
		assertFalse(MessageEnvelope.decode(GSON, "[1,2,3]").isPresent());
	}
}
