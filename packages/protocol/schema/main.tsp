import "@typespec/json-schema";
import "./pairing.tsp";
import "./envelope.tsp";
import "./reconnect.tsp";

using TypeSpec.JsonSchema;

@jsonSchema
namespace SmartMc.Protocol;
