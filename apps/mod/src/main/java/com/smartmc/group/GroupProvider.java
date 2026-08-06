package com.smartmc.group;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Read-only source of a player's group memberships, independent of where
 * that data actually lives. Deliberately read-only: this is what token
 * issuance/rotation and {@code /smartmc group list} need (a player's groups,
 * for authorization and display), not a CRUD surface -- group creation/
 * membership management stays on {@code com.smartmc.storage.GroupStore}
 * directly, which only the native provider's own {@code /smartmc group
 * create|invite|remove} commands touch. See {@link NativeGroupProvider}
 * (SmartMC's own DB-backed groups) and {@code FtbTeamsGroupProvider}
 * (FTB Teams-backed) for the two v1 implementations -- swappable via
 * {@code SmartMcConfig#groupProvider} so other group mods can plug in later
 * without touching anything that consumes this interface.
 */
public interface GroupProvider {

	/** A player can belong to more than one group under some backends (e.g. the native one), so this returns a list. */
	List<GroupInfo> findGroupsForPlayer(UUID playerUuid);

	Optional<GroupInfo> findGroupById(String id);
}
