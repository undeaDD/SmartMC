// Builds assets/fonts/TabIcons.ttf + assets/fonts/tab-icons-codepoints.json
// from the source SVGs in assets/icons/tabs/ (sourced from the Iconoir icon
// set -- see CLAUDE.md's apps/mobile section for why these render as rough
// filled silhouettes rather than proper icons for now: Iconoir's "regular"
// set is stroke-based, not filled, and font generation fills paths, not
// strokes).
//
// This bypasses `fantasticon`'s CLI directly: its directory-glob step
// (`path.join(dir, '**/*.svg')`) always normalizes to backslashes on
// Windows, which the underlying `glob` package then reads as an escaped,
// non-wildcard `\*` -- a real bug in fantasticon on Windows, not something
// fixable via its CLI flags. This script uses the same two libraries
// fantasticon uses internally (svgicons2svgfont + svg2ttf) directly against
// an explicit file list instead, sidestepping the broken glob step entirely.
//
// Re-run with:
//   bun run apps/mobile/scripts/generatefont.mjs

import { createReadStream, createWriteStream, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import svg2ttf from 'svg2ttf';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const inputDir = join(scriptDir, '../assets/icons/tabs');
const outputDir = join(scriptDir, '../assets/fonts');

const START_CODEPOINT = 0xf101;
const ICONS = ['home', 'devices', 'profile'];

const codepoints = Object.fromEntries(ICONS.map((name, i) => [name, START_CODEPOINT + i]));

const svgFontPath = join(outputDir, 'TabIcons.svg');
const ttfFontPath = join(outputDir, 'TabIcons.ttf');
const codepointsPath = join(outputDir, 'tab-icons-codepoints.json');

const fontStream = new SVGIcons2SVGFontStream({
  fontName: 'TabIcons',
  normalize: true,
  fontHeight: 300,
});

await new Promise((resolve, reject) => {
  const out = createWriteStream(svgFontPath);
  out.on('finish', resolve).on('error', reject);
  fontStream.on('error', reject);
  fontStream.pipe(out);

  for (const name of ICONS) {
    const glyph = createReadStream(join(inputDir, `${name}.svg`));
    glyph.metadata = { unicode: [String.fromCodePoint(codepoints[name])], name };
    fontStream.write(glyph);
  }
  fontStream.end();
});

const { readFileSync } = await import('node:fs');
const ttf = svg2ttf(readFileSync(svgFontPath, 'utf8'), {});
writeFileSync(ttfFontPath, Buffer.from(ttf.buffer));
writeFileSync(codepointsPath, `${JSON.stringify(codepoints, null, 2)}\n`);
unlinkSync(svgFontPath);

console.log(`Wrote ${ttfFontPath} and ${codepointsPath}`);
