package com.smartmc.command;

import net.minecraft.commands.CommandSourceStack;

/**
 * v1 backing implementation of {@link SmartMcPermissions}: vanilla's
 * built-in op-permission-level system ({@link CommandSourceStack#hasPermission(int)}),
 * zero new dependency. Deliberately simple -- swap in a real permission-node
 * system later if a server owner actually needs finer-grained control than
 * "op or not."
 */
public class VanillaPermissions implements SmartMcPermissions {

	@Override
	public boolean hasPermission(CommandSourceStack source, Permission permission) {
		return source.hasPermission(opLevelFor(permission));
	}

	private static int opLevelFor(Permission permission) {
		return switch (permission) {
			case PAIR, HELP -> 0; // any connected player
			case ADMIN -> 2; // server operator
		};
	}
}
