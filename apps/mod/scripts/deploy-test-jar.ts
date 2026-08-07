// Copies the freshly-built 1.21.1-neoforge jar into a local test server's
// mods folder (e.g. a PrismLauncher instance), replacing whatever's there --
// the fast dev-iteration loop this session's already been doing by hand.
// Path is per-machine, so it's read from SMARTMC_TEST_MODS_DIR (in a
// gitignored apps/mod/.env, see .env.example) rather than hardcoded here.

import { readdir, rm, copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

const modsDir = process.env.SMARTMC_TEST_MODS_DIR;
if (!modsDir) {
	console.error(
		"SMARTMC_TEST_MODS_DIR is not set -- copy apps/mod/.env.example to apps/mod/.env " +
			"and point it at your local test server's mods folder.",
	);
	process.exit(1);
}

const libsDir = join(import.meta.dir, "..", "versions", "1.21.1-neoforge", "build", "libs");
const entries = await readdir(libsDir);
const jar = entries.find(
	(name) => name.endsWith(".jar") && !name.includes("sources") && !name.includes("javadoc"),
);
if (!jar) {
	console.error(`No built jar found in ${libsDir} -- run the build first.`);
	process.exit(1);
}

const modsDirStat = await stat(modsDir).catch(() => null);
if (!modsDirStat?.isDirectory()) {
	console.error(`SMARTMC_TEST_MODS_DIR does not point at a real directory: ${modsDir}`);
	process.exit(1);
}

for (const existing of await readdir(modsDir)) {
	if (existing.startsWith("smartmc-") && existing.endsWith(".jar")) {
		await rm(join(modsDir, existing));
		console.log(`Removed stale ${existing}`);
	}
}

await copyFile(join(libsDir, jar), join(modsDir, jar));
console.log(`Copied ${jar} -> ${modsDir}`);
