// Mirrors the mod's Netty pipeline: LengthFieldBasedFrameDecoder(1 << 20, 0,
// 4, 0, 4) -- a 4-byte big-endian length prefix, stripped from the emitted
// frame -- paired with LengthFieldPrepender(4) for outgoing frames. Applies
// to everything sent *after* the magic-byte prefix (see MagicBytePeekDecoder
// on the mod side); the magic prefix itself is unframed raw bytes.

const MAX_FRAME_LENGTH = 1 << 20;

export function prependLength(payload: Uint8Array): Uint8Array {
  const framed = new Uint8Array(4 + payload.length);
  new DataView(framed.buffer).setUint32(0, payload.length, false);
  framed.set(payload, 4);
  return framed;
}

/** Buffers incoming chunks and yields complete length-prefixed frames as they arrive. */
export class FrameReader {
  private buffer = new Uint8Array(0);

  push(chunk: Uint8Array): Uint8Array[] {
    const combined = new Uint8Array(this.buffer.length + chunk.length);
    combined.set(this.buffer);
    combined.set(chunk, this.buffer.length);
    this.buffer = combined;

    const frames: Uint8Array[] = [];
    for (;;) {
      if (this.buffer.length < 4) break;
      const length = new DataView(this.buffer.buffer, this.buffer.byteOffset).getUint32(0, false);
      if (length > MAX_FRAME_LENGTH) throw new Error(`frame too large: ${length} bytes`);
      if (this.buffer.length < 4 + length) break;

      frames.push(this.buffer.slice(4, 4 + length));
      this.buffer = this.buffer.slice(4 + length);
    }
    return frames;
  }
}
