import * as SecureStore from 'expo-secure-store';

// Each paired server is stored under its own SecureStore key, with a small
// index key listing which ids currently exist -- not one growing JSON array
// under a single key. SecureStore values are capped at 2048 bytes on iOS;
// a single blob holding every paired server (tokens included) would risk
// that ceiling as more servers get paired, where per-server keys never will.
const INDEX_KEY = 'smartmc.paired_server_ids';

// SecureStore key names must be alphanumeric plus ".", "-", "_" only -- but
// `id` (host:port, see makeServerId below) contains a colon, which isn't
// allowed and throws at write time ("Invalid key provided to SecureStore").
// Sanitize when building the *key*; `id` itself stays "host:port" everywhere
// else (display, route params, matching) since only the key name is
// constrained, not values stored under it.
const serverKey = (id: string) => `smartmc.paired_server.${id.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

export type PairedServer = {
  id: string;
  host: string;
  port: number;
  serverName: string;
  deviceName: string;
  token: string;
  playerUuid: string;
  serverFingerprint: string;
};

/** The label to show for a paired server -- its user-given name, falling back to host:port when unset. */
export function serverLabel(server: Pick<PairedServer, 'serverName' | 'host' | 'port'>): string {
  return server.serverName ? server.serverName.trim() : `${server.host}:${server.port}`;
}

export function makeServerId(host: string, port: number): string {
  return `${host}:${port}`;
}

async function readIndex(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function writeIndex(ids: string[]): Promise<void> {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids));
}

export async function getPairedServers(): Promise<PairedServer[]> {
  const ids = await readIndex();
  const servers = await Promise.all(ids.map((id) => getPairedServer(id)));
  return servers.filter((server): server is PairedServer => server !== null);
}

export async function getPairedServer(id: string): Promise<PairedServer | null> {
  const raw = await SecureStore.getItemAsync(serverKey(id));
  return raw ? (JSON.parse(raw) as PairedServer) : null;
}

export async function savePairedServer(server: PairedServer): Promise<void> {
  await SecureStore.setItemAsync(serverKey(server.id), JSON.stringify(server));
  const ids = await readIndex();
  if (!ids.includes(server.id)) {
    await writeIndex([...ids, server.id]);
  }
}

export async function removePairedServer(id: string): Promise<void> {
  await SecureStore.deleteItemAsync(serverKey(id));
  const ids = await readIndex();
  await writeIndex(ids.filter((existingId) => existingId !== id));
}
