package com.smartmc.group;

import java.util.Set;
import java.util.UUID;

/** A group/team as seen through a {@link GroupProvider}, independent of the backing source. */
public record GroupInfo(String id, String name, UUID ownerUuid, Set<UUID> memberUuids) {
}
