package com.smartmc.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.context.CommandContext;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.smartmc.SmartMC;
import com.smartmc.command.SmartMcPermissions.Permission;
import com.smartmc.group.GroupInfo;
import com.smartmc.group.NativeGroupProvider;
import com.smartmc.storage.GroupRecord;
import com.smartmc.storage.SessionRecord;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;

import java.sql.SQLException;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds the {@code /smartmc} command tree. Pure vanilla types
 * ({@link CommandDispatcher}, {@link CommandSourceStack}, {@link Commands})
 * -- identical on Fabric and NeoForge, so this class needs no {@code //? loader {}}
 * guards. Each loader only supplies the one-line registration hook (see
 * {@code platform/fabric/FabricEntrypoint} and {@code platform/neoforge/NeoforgeServerEventSubscriber}).
 *
 * <p>{@code sessions} and {@code group} are pure chat commands (no bearer
 * token involved -- the in-game player identity via {@link CommandSourceStack#getPlayerOrException()}
 * is the authorization), matching CLAUDE.md's own documented self-service
 * design and doubling as an emergency access-recovery path if a phone is
 * lost, without needing the app at all.
 */
public final class SmartMcCommand {

	/** Kept in sync with the tree built in {@link #register} -- used only to render {@code help}. */
	private static final List<CommandInfo> COMMANDS = List.of(
		new CommandInfo("/smartmc pair", "Generates a pairing code to link the SmartMC app to your account."),
		new CommandInfo("/smartmc sessions list", "Lists your paired devices."),
		new CommandInfo("/smartmc sessions revoke <id>", "Revokes a paired device's access."),
		new CommandInfo("/smartmc group create <name>", "Creates a group you own."),
		new CommandInfo("/smartmc group invite <player>", "Invites an online player to a group you own."),
		new CommandInfo("/smartmc group remove <player>", "Removes a player from a group you own."),
		new CommandInfo("/smartmc group list", "Lists the groups you belong to."),
		new CommandInfo("/smartmc admin list <player>", "Ops only: lists another (online) player's paired devices."),
		new CommandInfo("/smartmc admin revoke <player> <id>", "Ops only: revokes another (online) player's paired device."),
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
			.then(Commands.literal("sessions")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.SESSIONS))
				.then(Commands.literal("list").executes(SmartMcCommand::sessionsList))
				.then(Commands.literal("revoke")
					.then(Commands.argument("id", StringArgumentType.word())
						.executes(SmartMcCommand::sessionsRevoke))))
			.then(Commands.literal("group")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.GROUP))
				.then(Commands.literal("create")
					.then(Commands.argument("name", StringArgumentType.word())
						.executes(SmartMcCommand::groupCreate)))
				.then(Commands.literal("invite")
					.then(Commands.argument("player", StringArgumentType.word())
						.executes(ctx -> groupMembership(ctx, true))))
				.then(Commands.literal("remove")
					.then(Commands.argument("player", StringArgumentType.word())
						.executes(ctx -> groupMembership(ctx, false))))
				.then(Commands.literal("list").executes(SmartMcCommand::groupList)))
			.then(Commands.literal("admin")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.ADMIN))
				.then(Commands.literal("list")
					.then(Commands.argument("player", StringArgumentType.word())
						.executes(SmartMcCommand::adminList)))
				.then(Commands.literal("revoke")
					.then(Commands.argument("player", StringArgumentType.word())
						.then(Commands.argument("id", StringArgumentType.word())
							.executes(SmartMcCommand::adminRevoke)))))
			.then(Commands.literal("help")
				.requires(source -> SmartMC.permissions().hasPermission(source, Permission.HELP))
				.executes(SmartMcCommand::help)));
	}

	private static int pair(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null) {
			return 0;
		}

		int ttlSeconds = SmartMC.config().pairingCodeTtlSeconds;
		String code = SmartMC.pairingCodes().generate(player.getUUID(), Duration.ofSeconds(ttlSeconds));
		ctx.getSource().sendSuccess(() -> Component.literal(
			"Your SmartMC pairing code is " + code + " -- enter it in the app within " + (ttlSeconds / 60) + " minutes."), false);
		return 1;
	}

	private static int sessionsList(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null) {
			return 0;
		}
		return listSessions(ctx.getSource(), player.getUUID(), "Your paired devices:", "You have no paired devices.");
	}

	/** Ops-only override of {@code sessionsList} -- same rendering, against a named (online) player instead of the caller. */
	private static int adminList(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer target = requireOnlinePlayer(ctx, "player");
		if (target == null) {
			return 0;
		}
		String name = target.getName().getString();
		return listSessions(ctx.getSource(), target.getUUID(), name + "'s paired devices:", name + " has no paired devices.");
	}

	private static int listSessions(CommandSourceStack source, UUID ownerUuid, String header, String emptyMessage) {
		List<SessionRecord> sessions;
		try {
			sessions = SmartMC.sessions().findByOwner(ownerUuid);
		} catch (SQLException e) {
			source.sendFailure(Component.literal("Server error while listing paired devices."));
			return 0;
		}

		if (sessions.isEmpty()) {
			source.sendSuccess(() -> Component.literal(emptyMessage), false);
			return 1;
		}
		source.sendSuccess(() -> Component.literal(header), false);
		for (SessionRecord session : sessions) {
			String line = shortId(session.deviceId()) + " -- " + session.deviceName();
			source.sendSuccess(() -> Component.literal(line), false);
		}
		return 1;
	}

	private static int sessionsRevoke(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null) {
			return 0;
		}
		return revokeSession(ctx.getSource(), player.getUUID(), StringArgumentType.getString(ctx, "id"), null);
	}

	/**
	 * Ops-only override of {@code sessionsRevoke} -- same short-id prefix
	 * matching and error messages, but against the named player's sessions
	 * instead of the caller's own. v1 requires the target to be online, same
	 * limitation as {@code groupMembership}'s player lookup (no offline-UUID
	 * resolution yet).
	 */
	private static int adminRevoke(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer target = requireOnlinePlayer(ctx, "player");
		if (target == null) {
			return 0;
		}
		return revokeSession(ctx.getSource(), target.getUUID(), StringArgumentType.getString(ctx, "id"), target.getName().getString());
	}

	/** @param targetLabel null for self-service (no name suffix, no op broadcast); the target's name for the admin override. */
	private static int revokeSession(CommandSourceStack source, UUID ownerUuid, String idPrefix, String targetLabel) {
		String normalizedPrefix = idPrefix.toLowerCase(Locale.ROOT);
		List<SessionRecord> sessions;
		try {
			sessions = SmartMC.sessions().findByOwner(ownerUuid);
		} catch (SQLException e) {
			source.sendFailure(Component.literal("Server error while revoking that device."));
			return 0;
		}

		List<SessionRecord> matches = sessions.stream()
			.filter(session -> shortId(session.deviceId()).startsWith(normalizedPrefix))
			.collect(Collectors.toList());

		String suffix = targetLabel == null ? "" : " for " + targetLabel;
		if (matches.isEmpty()) {
			source.sendFailure(Component.literal("No paired device found matching '" + normalizedPrefix + "'" + suffix + "."));
			return 0;
		}
		if (matches.size() > 1) {
			source.sendFailure(Component.literal("Multiple paired devices match '" + normalizedPrefix + "' -- use more characters."));
			return 0;
		}

		SessionRecord match = matches.get(0);
		try {
			SmartMC.sessions().revoke(match.jti());
		} catch (SQLException e) {
			source.sendFailure(Component.literal("Server error while revoking that device."));
			return 0;
		}
		source.sendSuccess(() -> Component.literal("Revoked '" + match.deviceName() + "'" + suffix + "."), targetLabel != null);
		return 1;
	}

	private static int groupCreate(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null || !requireNativeProvider(ctx)) {
			return 0;
		}

		String name = StringArgumentType.getString(ctx, "name");
		try {
			SmartMC.groups().createGroup(UUID.randomUUID().toString(), name, player.getUUID());
		} catch (SQLException e) {
			ctx.getSource().sendFailure(Component.literal("Server error while creating the group."));
			return 0;
		}
		ctx.getSource().sendSuccess(() -> Component.literal("Created group '" + name + "'."), false);
		return 1;
	}

	private static int groupMembership(CommandContext<CommandSourceStack> ctx, boolean invite) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null || !requireNativeProvider(ctx)) {
			return 0;
		}

		ServerPlayer target = requireOnlinePlayer(ctx, "player");
		if (target == null) {
			return 0;
		}

		List<GroupRecord> owned;
		try {
			owned = SmartMC.groups().findByOwner(player.getUUID());
		} catch (SQLException e) {
			ctx.getSource().sendFailure(Component.literal("Server error while looking up your groups."));
			return 0;
		}
		if (owned.isEmpty()) {
			ctx.getSource().sendFailure(Component.literal("You don't own a group -- create one with /smartmc group create <name>."));
			return 0;
		}
		if (owned.size() > 1) {
			String names = owned.stream().map(GroupRecord::name).collect(Collectors.joining(", "));
			ctx.getSource().sendFailure(Component.literal(
				"You own multiple groups (" + names + ") -- managing members isn't supported yet when you own more than one."));
			return 0;
		}

		GroupRecord group = owned.get(0);
		try {
			if (invite) {
				SmartMC.groups().addMember(group.id(), target.getUUID());
			} else {
				SmartMC.groups().removeMember(group.id(), target.getUUID());
			}
		} catch (SQLException e) {
			ctx.getSource().sendFailure(Component.literal("Server error while updating the group."));
			return 0;
		}

		String message = (invite ? "Added " : "Removed ") + target.getName().getString()
			+ (invite ? " to '" : " from '") + group.name() + "'.";
		ctx.getSource().sendSuccess(() -> Component.literal(message), false);
		return 1;
	}

	private static int groupList(CommandContext<CommandSourceStack> ctx) {
		ServerPlayer player = requirePlayer(ctx);
		if (player == null) {
			return 0;
		}

		List<GroupInfo> groups = SmartMC.groupProvider().findGroupsForPlayer(player.getUUID());
		if (groups.isEmpty()) {
			ctx.getSource().sendSuccess(() -> Component.literal("You aren't in any groups."), false);
			return 1;
		}
		ctx.getSource().sendSuccess(() -> Component.literal("Your groups:"), false);
		for (GroupInfo group : groups) {
			String line = "- " + group.name();
			ctx.getSource().sendSuccess(() -> Component.literal(line), false);
		}
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

	private static ServerPlayer requirePlayer(CommandContext<CommandSourceStack> ctx) {
		try {
			return ctx.getSource().getPlayerOrException();
		} catch (CommandSyntaxException e) {
			ctx.getSource().sendFailure(Component.literal("This command must be run by a player."));
			return null;
		}
	}

	/** v1 limitation shared by every command that targets another player: only online players can be resolved (no offline-UUID lookup yet). */
	private static ServerPlayer requireOnlinePlayer(CommandContext<CommandSourceStack> ctx, String argumentName) {
		String targetName = StringArgumentType.getString(ctx, argumentName);
		ServerPlayer target = ctx.getSource().getServer().getPlayerList().getPlayerByName(targetName);
		if (target == null) {
			ctx.getSource().sendFailure(Component.literal("Player '" + targetName + "' isn't online."));
			return null;
		}
		return target;
	}

	private static boolean requireNativeProvider(CommandContext<CommandSourceStack> ctx) {
		if (!(SmartMC.groupProvider() instanceof NativeGroupProvider)) {
			ctx.getSource().sendFailure(Component.literal("Group management is handled by FTB Teams -- use its own commands."));
			return false;
		}
		return true;
	}

	private static String shortId(String deviceId) {
		return deviceId.replace("-", "").substring(0, 8).toLowerCase(Locale.ROOT);
	}

	private record CommandInfo(String usage, String description) {
	}
}
