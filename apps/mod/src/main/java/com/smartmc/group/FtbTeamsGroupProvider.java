package com.smartmc.group;

import dev.ftb.mods.ftbteams.api.FTBTeamsAPI;
import dev.ftb.mods.ftbteams.api.Team;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Wraps FTB Teams' own team system instead of SmartMC's native one, for
 * server owners who already use it. API verified directly against
 * {@code FTBTeam/FTB-Teams}'s `1.21.1/main` branch source (not assumed):
 * {@code FTBTeamsAPI.api().getManager()} returns a {@code TeamManager} whose
 * {@code getTeamForPlayerID(UUID)} gives at most one {@code Team} (FTB is
 * one-team-per-player, unlike the native provider). <b>Must only ever be
 * constructed when {@code Platform.isModLoaded("ftbteams")} is true</b> --
 * see {@code SmartMC.onServerStarting} for the guard; the class itself needs
 * no loader guard since FTB Teams' API is identical on Fabric and NeoForge,
 * it just must never be touched when the mod isn't present.
 */
public class FtbTeamsGroupProvider implements GroupProvider {

	@Override
	public List<GroupInfo> findGroupsForPlayer(UUID playerUuid) {
		return FTBTeamsAPI.api().getManager().getTeamForPlayerID(playerUuid)
			.map(FtbTeamsGroupProvider::toGroupInfo)
			.map(List::of)
			.orElse(List.of());
	}

	@Override
	public Optional<GroupInfo> findGroupById(String id) {
		UUID teamId;
		try {
			teamId = UUID.fromString(id);
		} catch (IllegalArgumentException e) {
			return Optional.empty();
		}
		return FTBTeamsAPI.api().getManager().getTeamByID(teamId).map(FtbTeamsGroupProvider::toGroupInfo);
	}

	private static GroupInfo toGroupInfo(Team team) {
		return new GroupInfo(team.getId().toString(), team.getShortName(), team.getOwner(), team.getMembers());
	}
}
