package com.smartmc.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.smartmc.SmartMC;
import com.smartmc.command.SmartMcPermissions.Permission;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;

import java.time.Duration;
import java.util.List;

/**
 * Builds the {@code /smartmc} command tree. Pure vanilla types
 * ({@link CommandDispatcher}, {@link CommandSourceStack}, {@link Commands})
 * -- identical on Fabric and NeoForge, so this class needs no {@code //? loader {}}
 * guards. Each loader only supplies the one-line registration hook (see
 * {@code platform/fabric/FabricEntrypoint} and {@code platform/neoforge/NeoforgeServerEventSubscriber}).
 */
public final class SmartMcCommand {

	/** Kept in sync with the tree built in {@link #register} -- used only to render {@code help}. */
	private static final List<CommandInfo> COMMANDS = List.of(
		new CommandInfo("/smartmc pair", "Generates a pairing code to link the SmartMC app to your account."),
		new CommandInfo("/smartmc help", "Shows this list of commands.")
	);

	private SmartMcCommand() {
	}

	public static void register(CommandDispatcher<CommandSourceStack> dispatcher) {
		dispatcher.register(Commands.literal("smartmc")
			.executes(SmartMcCommand::help)
			.then(Commands.literal("pair")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.PAIR))
				.executes(SmartMcCommand::pair))
			.then(Commands.literal("help")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.HELP))
				.executes(SmartMcCommand::help)));
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

	/** Also the fallback for bare {@code /smartmc} with no subcommand, instead of Brigadier's generic parse error. */
	private static int help(CommandContext<CommandSourceStack> ctx) {
		CommandSourceStack source = ctx.getSource();
		source.sendSuccess(() -> Component.literal("SmartMC commands:"), false);
		for (CommandInfo command : COMMANDS) {
			source.sendSuccess(() -> Component.literal(command.usage() + " -- " + command.description()), false);
		}
		return 1;
	}

	private record CommandInfo(String usage, String description) {
	}
}
