import TcpSocket from 'react-native-tcp-socket';

/**
 * A bare TCP connect-then-close, not a SmartMC protocol handshake -- this
 * only answers "is anything listening on this host:port at all", which is
 * exactly what a server-list "online/offline" indicator needs and is far
 * cheaper than running the full Noise handshake (`withSmartMcConnection`)
 * just to find out.
 */
export function checkServerReachable(
  host: string,
  port: number,
  timeoutMs = 4000,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(result);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    const socket = TcpSocket.createConnection({ port, host }, () => finish(true));
    socket.on('error', () => finish(false));
  });
}
