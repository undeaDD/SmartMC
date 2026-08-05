// Regenerates every app.json-referenced icon/splash asset in
// apps/mobile/assets/images/ from the project's brand mark
// (apps/landing/src/assets/smartmc-logo.svg). Run with:
//   bun run apps/mobile/scripts/generate-icons.ts
// Re-run whenever the logo changes -- nothing here should be hand-edited.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BRAND_GREEN = '#39bf45';
const INK_950 = '#121212';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const logoPath = join(scriptDir, '../../landing/src/assets/smartmc-logo.svg');
const outDir = join(scriptDir, '../assets/images');
const logoSvg = readFileSync(logoPath, 'utf8');

function coloredLogo(color: string): Buffer {
  return Buffer.from(logoSvg.replace('fill="currentColor"', `fill="${color}"`));
}

async function logoOnBackground(size: number, background: string, logoColor: string, inset = 0.72) {
  const logoSize = Math.round(size * inset);
  const logoPng = await sharp(coloredLogo(logoColor)).resize(logoSize, logoSize).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function logoOnTransparent(size: number, logoColor: string, inset = 0.72) {
  const logoSize = Math.round(size * inset);
  const logoPng = await sharp(coloredLogo(logoColor)).resize(logoSize, logoSize).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png()
    .toBuffer();
}

function solidBackground(size: number, background: string) {
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .png()
    .toBuffer();
}

const outputs: Array<[string, Promise<Buffer>]> = [
  // Main app icon: brand-green square, dark logo -- matches the badge
  // treatment already established on the web (Layout.astro's navbar/footer).
  ['icon.png', logoOnBackground(1024, BRAND_GREEN, INK_950)],
  ['favicon.png', logoOnBackground(196, BRAND_GREEN, INK_950)],
  // Splash screen supplies its own white background via app.json, so the
  // image itself stays transparent with just the dark mark.
  ['splash-icon.png', logoOnTransparent(1024, INK_950, 0.5)],
  // Android adaptive icon: three separate layers composited by the OS.
  // Foreground/monochrome use a smaller inset (~55%) than the flat app
  // icon since adaptive icons crop into various shapes (circle, squircle,
  // etc.) and need extra padding to stay inside every mask's safe zone.
  ['android-icon-foreground.png', logoOnTransparent(432, INK_950, 0.55)],
  ['android-icon-background.png', solidBackground(432, BRAND_GREEN)],
  // Android 13+ themed icons: OS applies its own tint, so this just needs
  // to be a plain white silhouette on transparent.
  ['android-icon-monochrome.png', logoOnTransparent(432, '#ffffff', 0.55)],
];

for (const [name, bufferPromise] of outputs) {
  const buffer = await bufferPromise;
  const outPath = join(outDir, name);
  await sharp(buffer).toFile(outPath);
  console.log(`Wrote ${outPath}`);
}
