import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
namespace SmartMc.Protocol;

/** A trivial ping/pong pair used only to prove the TypeSpec -> JSON Schema -> Java + TS codegen pipeline end to end (M0 gate). Not part of the real protocol. */
model PingMessage {
  /** Monotonically increasing sequence number set by the sender. */
  sequence: int32;

  /** Free-form text echoed back by the receiver. */
  message: string;
}
