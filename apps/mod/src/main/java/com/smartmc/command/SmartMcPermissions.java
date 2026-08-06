package com.smartmc.command;

import net.minecraft.commands.CommandSourceStack;

/**
 * Permission gate for {@code /smartmc} commands, kept behind an interface so
 * the backing check can be swapped later (e.g. for a real permission-node
 * system like Fabric Permissions API/LuckPerms on Fabric or NeoForge's own
 * {@code PermissionAPI}) without touching {@link SmartMcCommand}'s
 * registration code. See {@link VanillaPermissions} for the current (v1)
 * implementation.
 */
public interface SmartMcPermissions {

	boolean hasPermission(CommandSourceStack source, Permission permission);

	/** One entry per gated action, not per command -- a future command can reuse an existing level. */
	enum Permission {
		/** Any connected player -- pairing your own device. */
		PAIR,
		/** Any connected player -- listing available commands. */
		HELP,
		/** Any connected player -- managing your own paired devices. */
		SESSIONS,
		/** Any connected player -- managing groups you own/belong to. */
		GROUP,
		/** Server operators only -- reserved for future admin-only subcommands. */
		ADMIN
	}
}
