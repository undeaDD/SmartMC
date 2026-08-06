package com.smartmc.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.smartmc.SmartMC;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;

import java.time.Duration;

/**
 * Builds the {@code /smartmc} command tree. Pure vanilla types
 * ({@link CommandDispatcher}, {@link CommandSourceStack}, {@link Commands})
 * -- identical on Fabric and NeoForge, so this class needs no {@code //? loader {}}
 * guards. Each loader only supplies the one-line registration hook (see
 * {@code platform/fabric/FabricEntrypoint} and {@code platform/neoforge/NeoforgeServerEventSubscriber}).
 */
public final class SmartMcCommand {

	private SmartMcCommand() {
	}

	public static void register(CommandDispatcher<CommandSourceStack> dispatcher) {
		dispatcher.register(Commands.literal("smartmc")
			.then(Commands.literal("pair").executes(SmartMcCommand::pair)));
	}

	private static int pair(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player;
		try {
			player = ctx.getSource().getPlayerOrException();
		} catch (CommandSyntaxException e) {
			ctx.getSource().sendFailure(Component.literal("This command must be run by a player."));
			return 0;
		}

		int ttlSeconds = SmartMC.config().pairingCodeTtlSeconds;
		String code = SmartMC.pairingCodes().generate(player.getUUID(), Duration.ofSeconds(ttlSeconds));
		ctx.getSource().sendSuccess(() -> Component.literal(
			"Your SmartMC pairing code is " + code + " -- enter it in the app within " + (ttlSeconds / 60) + " minutes."), false);
		return 1;
	}
}
