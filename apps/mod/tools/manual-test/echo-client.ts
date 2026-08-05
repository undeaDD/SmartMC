// Manual M1 verification tool: connects to a live SmartMC-patched Minecraft
// server, sends the magic-byte prefix + a length-prefixed JSON message, and
// checks that the same message comes back. Doesn't touch any real Minecraft
// protocol -- this only exercises the multiplex handshake and the ad hoc
// echo handler from com.smartmc.network (both replaced by the real protocol
// in M4). Run with: bun run apps/mod/tools/manual-test/echo-client.ts [host] [port]

const MAGIC_PREFIX = Buffer.from([0x53, 0x4d, 0x43, 0x01]);

function frame(payload: string): Buffer {
  const body = Buffer.from(payload, 'utf8');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  return Buffer.concat([length, body]);
}

const host = process.argv[2] ?? '127.0.0.1';
const port = Number(process.argv[3] ?? 25565);
const message = JSON.stringify({ type: 'ping', from: 'echo-client.ts' });

console.log(`Connecting to ${host}:${port} ...`);

let received = Buffer.alloc(0);

try {
  const socket = await Bun.connect({
    hostname: host,
    port,
    socket: {
      open(sock) {
        console.log('Connected. Sending magic prefix + framed message:', message);
        sock.write(Buffer.concat([MAGIC_PREFIX, frame(message)]));
      },
      data(sock, chunk) {
        received = Buffer.concat([received, chunk]);
        if (received.length < 4) return;

        const bodyLength = received.readUInt32BE(0);
        if (received.length < 4 + bodyLength) return;

        const body = received.subarray(4, 4 + bodyLength).toString('utf8');
        console.log('Received framed response:', body);

        if (body === message) {
          console.log('PASS: echo matched what we sent.');
          process.exitCode = 0;
        } else {
          console.error('FAIL: echo did not match what we sent.');
          process.exitCode = 1;
        }
        sock.end();
      },
      close() {
        console.log('Connection closed.');
      },
      error(_sock, error) {
        console.error('Socket error:', error);
        process.exitCode = 1;
      },
    },
  });

  setTimeout(() => {
    if (received.length === 0) {
      console.error(
        "FAIL: no response received within 5s -- multiplex handshake likely didn't match, or the mod isn't running.",
      );
      process.exitCode = 1;
      socket.end();
    }
  }, 5000);
} catch (error) {
  console.error(
    `FAIL: could not connect to ${host}:${port} --`,
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
