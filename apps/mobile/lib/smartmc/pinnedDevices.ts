import * as SecureStore from 'expo-secure-store';

// Reuses SecureStore (already a dependency, already the pattern `storage.ts`
// uses) rather than adding a new storage dependency just for this -- pinned
// devices aren't sensitive, but a new native module (e.g. AsyncStorage,
// expo-file-system) would need its own EAS dev-client rebuild, which nothing
// else in this pass needs. A composite `serverId::deviceId` key is required
// since device ids are only guaranteed unique *within* one server's own H2
// database, not globally across independently-paired servers.
const PINNED_KEY = 'smartmc.pinned_devices';

export type PinnedDeviceRef = { serverId: string; deviceId: string };

function refKey(ref: PinnedDeviceRef): string {
  return `${ref.serverId}::${ref.deviceId}`;
}

function parseRefKey(key: string): PinnedDeviceRef {
  const separatorIndex = key.indexOf('::');
  return { serverId: key.slice(0, separatorIndex), deviceId: key.slice(separatorIndex + 2) };
}

export async function getPinnedDeviceRefs(): Promise<PinnedDeviceRef[]> {
  const raw = await SecureStore.getItemAsync(PINNED_KEY);
  return raw ? (JSON.parse(raw) as string[]).map(parseRefKey) : [];
}

async function writePinnedDeviceRefs(refs: PinnedDeviceRef[]): Promise<void> {
  await SecureStore.setItemAsync(PINNED_KEY, JSON.stringify(refs.map(refKey)));
}

export async function pinDevice(ref: PinnedDeviceRef): Promise<void> {
  const refs = await getPinnedDeviceRefs();
  if (refs.some((existing) => refKey(existing) === refKey(ref))) return;
  await writePinnedDeviceRefs([...refs, ref]);
}

export async function unpinDevice(ref: PinnedDeviceRef): Promise<void> {
  const refs = await getPinnedDeviceRefs();
  await writePinnedDeviceRefs(refs.filter((existing) => refKey(existing) !== refKey(ref)));
}

/** Persists a full reordering (drag-and-drop result) in one write. */
export async function reorderPinnedDevices(refs: PinnedDeviceRef[]): Promise<void> {
  await writePinnedDeviceRefs(refs);
}

export function isSameDeviceRef(a: PinnedDeviceRef, b: PinnedDeviceRef): boolean {
  return refKey(a) === refKey(b);
}
