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
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HexFormat;

/**
 * The server's own Ed25519 identity keypair, generated once and persisted
 * to {@code config/smartmc/identity.json}, then loaded on every subsequent
 * start. Deliberately separate from the Noise handshake's X25519 static
 * keypair (a later slice's concern) -- see CLAUDE.md's "Security model"
 * section for why the two are kept apart. Uses JDK-native Ed25519 (JEP
 * 339), no extra crypto dependency.
 */
public class ServerIdentity {

	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final String FILE_NAME = "identity.json";
	private static final String ALGORITHM = "Ed25519";

	private final KeyPair keyPair;

	private ServerIdentity(KeyPair keyPair) {
		this.keyPair = keyPair;
	}

	public PublicKey publicKey() {
		return keyPair.getPublic();
	}

	public PrivateKey privateKey() {
		return keyPair.getPrivate();
	}

	/** SHA-256 of the public key's encoded form, hex, for logging/TOFU display -- not a secret. */
	public String fingerprint() {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(publicKey().getEncoded());
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
		}
	}

	public static ServerIdentity load(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		if (Files.exists(file)) {
			try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
				Stored stored = GSON.fromJson(reader, Stored.class);
				if (stored != null && stored.publicKey != null && stored.privateKey != null) {
					return new ServerIdentity(decode(stored));
				}
				SmartMC.LOGGER.warn("{} was empty or invalid, generating a new identity", file);
			} catch (IOException | InvalidKeySpecException e) {
				SmartMC.LOGGER.warn("Failed to read {}, generating a new identity", file, e);
			}
		}

		ServerIdentity identity = new ServerIdentity(generate());
		identity.save(configDir);
		return identity;
	}

	private void save(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		Stored stored = new Stored();
		stored.publicKey = Base64.getEncoder().encodeToString(publicKey().getEncoded());
		stored.privateKey = Base64.getEncoder().encodeToString(privateKey().getEncoded());
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
			throw new IllegalStateException(ALGORITHM + " unavailable -- requires JDK 15+", e);
		}
	}

	private static KeyPair decode(Stored stored) throws InvalidKeySpecException {
		try {
			KeyFactory factory = KeyFactory.getInstance(ALGORITHM);
			PublicKey publicKey = factory.generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(stored.publicKey)));
			PrivateKey privateKey = factory.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(stored.privateKey)));
			return new KeyPair(publicKey, privateKey);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(ALGORITHM + " unavailable -- requires JDK 15+", e);
		}
	}

	private static class Stored {
		String publicKey;
		String privateKey;
	}
}
