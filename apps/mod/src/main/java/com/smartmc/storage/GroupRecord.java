package com.smartmc.storage;

import java.util.List;
import java.util.UUID;

public record GroupRecord(String id, String name, UUID ownerUuid, List<UUID> memberUuids) {
}
