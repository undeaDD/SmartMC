import "@typespec/json-schema";
import "./pairing.tsp";
import "./envelope.tsp";
import "./reconnect.tsp";
import "./devices.tsp";
import "./serverIcon.tsp";

using TypeSpec.JsonSchema;

@jsonSchema
namespace SmartMc.Protocol;
