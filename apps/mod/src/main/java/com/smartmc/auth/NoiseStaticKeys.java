package com.smartmc.auth;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.smartmc.SmartMC;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * The server's own X25519 static keypair used only for the Noise_XX handshake
 * (Layer 1 transport encryption), generated once and persisted to
 * {@code config/smartmc/noise_static.json}. Deliberately a separate class and
 * file from {@link ServerIdentity}'s Ed25519 keypair (Layer 2 auth-token
 * signing) even though the load/persist mechanics are identical -- see
 * CLAUDE.md's "Security model" section for why the two must never be
 * conflated. Uses JDK-native X25519 (JEP 324), no extra crypto dependency.
 */
public class NoiseStaticKeys {

	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final String FILE_NAME = "noise_static.json";
	private static final String ALGORITHM = "X25519";

	private final KeyPair keyPair;

	private NoiseStaticKeys(KeyPair keyPair) {
		this.keyPair = keyPair;
	}

	public KeyPair keyPair() {
		return keyPair;
	}

	public PublicKey publicKey() {
		return keyPair.getPublic();
	}

	public static NoiseStaticKeys load(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		if (Files.exists(file)) {
			try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
				Stored stored = GSON.fromJson(reader, Stored.class);
				if (stored != null && stored.publicKey != null && stored.privateKey != null) {
					return new NoiseStaticKeys(decode(stored));
				}
				SmartMC.LOGGER.warn("{} was empty or invalid, generating new Noise static keys", file);
			} catch (IOException | InvalidKeySpecException e) {
				SmartMC.LOGGER.warn("Failed to read {}, generating new Noise static keys", file, e);
			}
		}

		NoiseStaticKeys keys = new NoiseStaticKeys(generate());
		keys.save(configDir);
		return keys;
	}

	private void save(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		Stored stored = new Stored();
		stored.publicKey = Base64.getEncoder().encodeToString(publicKey().getEncoded());
		stored.privateKey = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
		try {
			Files.createDirectories(configDir);
			Path tmp = configDir.resolve(FILE_NAME + ".tmp");
			Files.writeString(tmp, GSON.toJson(stored), StandardCharsets.UTF_8);
			Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
		} catch (IOException e) {
			SmartMC.LOGGER.error("Failed to write {}", file, e);
		}
	}

	private static KeyPair generate() {
		try {
			return KeyPairGenerator.getInstance(ALGORITHM).generateKeyPair();
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(ALGORITHM + " unavailable -- requires JDK 11+", e);
		}
	}

	private static KeyPair decode(Stored stored) throws InvalidKeySpecException {
		try {
			KeyFactory factory = KeyFactory.getInstance(ALGORITHM);
			PublicKey publicKey = factory.generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(stored.publicKey)));
			PrivateKey privateKey = factory.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(stored.privateKey)));
			return new KeyPair(publicKey, privateKey);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(ALGORITHM + " unavailable -- requires JDK 11+", e);
		}
	}

	private static class Stored {
		String publicKey;
		String privateKey;
	}
}
