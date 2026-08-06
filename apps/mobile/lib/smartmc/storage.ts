import * as SecureStore from 'expo-secure-store';

// v1 scope: a single most-recently-paired server. CLAUDE.md's fuller Profile
// spec (multi-server list, pair/unpair per server, pinned identities) is
// later work -- this is enough to make pairing actually persist something
// real without building a list UI that isn't needed yet.
const STORAGE_KEY = 'smartmc.paired_server';

export type PairedServer = {
  host: string;
  port: number;
  deviceName: string;
  token: string;
  playerUuid: string;
  serverFingerprint: string;
};

export async function savePairedServer(server: PairedServer): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(server));
}

export async function getPairedServer(): Promise<PairedServer | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PairedServer) : null;
}

export async function clearPairedServer(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
