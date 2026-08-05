// Reads every JSON Schema file emitted by `tsp compile` (generated/jsonschema/*.json)
// and generates a matching plain TypeScript `interface` per file, plus a barrel
// index.ts re-exporting all of them. Zero runtime dependency in the output --
// json-schema-to-typescript emits type-only declarations.

import { readdir, mkdir, writeFile, rm } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { compile } from "json-schema-to-typescript";

const jsonSchemaDir = join(import.meta.dir, "..", "generated", "jsonschema");
const tsOutDir = join(import.meta.dir, "..", "generated", "ts");

async function main() {
  await rm(tsOutDir, { recursive: true, force: true });
  await mkdir(tsOutDir, { recursive: true });

  const entries = (await readdir(jsonSchemaDir)).filter((f) => f.endsWith(".json"));
  if (entries.length === 0) {
    throw new Error(`No JSON Schema files found in ${jsonSchemaDir} -- run generate:jsonschema first.`);
  }

  const names: string[] = [];

  for (const entry of entries) {
    const name = basename(entry, extname(entry));
    const schemaPath = join(jsonSchemaDir, entry);
    const schema = await Bun.file(schemaPath).json();
    // json-schema-to-typescript derives the interface name from $id when present,
    // which TypeSpec sets to "<Name>.json" -- override it so the generated
    // interface is named exactly after the model (e.g. `PingMessage`, not
    // `PingMessageJson`).
    schema.$id = name;

    const ts = await compile(schema, name, {
      cwd: jsonSchemaDir,
      bannerComment:
        "/* eslint-disable */\n/**\n * Generated from packages/protocol/schema/*.tsp via JSON Schema.\n * Do not edit by hand -- run `bun run protocol:generate`.\n */",
      style: { singleQuote: true },
    });

    await writeFile(join(tsOutDir, `${name}.ts`), ts, "utf-8");
    names.push(name);
  }

  const index = names.map((n) => `export type { ${n} } from "./${n}";`).join("\n") + "\n";
  await writeFile(join(tsOutDir, "index.ts"), index, "utf-8");

  console.log(`Generated ${names.length} TypeScript type file(s) in ${tsOutDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
