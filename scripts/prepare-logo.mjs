// Turns the founder-provided raster logo (white background) into transparent PNGs.
// This is technical cleanup only; the official vector (SVG) logo is still pending.
// Usage: node scripts/prepare-logo.mjs
import sharp from "sharp";

const SRC = "brand/logo-original.png";

/** Removes the white background: alpha from "distance to white", then un-premultiplies. */
async function knockOutWhite(input) {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    // Brand colors have min channel <= ~100; near-white pixels (min > 248) become transparent.
    const alpha = Math.max(0, Math.min(1, (248 - min) / (248 - 120)));
    if (alpha === 0) {
      data[i + 3] = 0;
      continue;
    }
    const unmix = (c) => Math.round(Math.max(0, Math.min(255, (c - 255 * (1 - alpha)) / alpha)));
    data[i] = unmix(r);
    data[i + 1] = unmix(g);
    data[i + 2] = unmix(b);
    data[i + 3] = Math.round(alpha * 255);
  }
  return sharp(data, { raw: info });
}

async function main() {
  const transparent = await knockOutWhite(sharp(SRC));
  const png = await transparent.png().toBuffer();

  // Full lockup, trimmed to content.
  const full = await sharp(png).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  await sharp(full.data)
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile("public/brand/goglobe-logo.png");

  // Icon only (globe mark): left square of the trimmed lockup.
  const iconSize = full.info.height;
  const icon = await sharp(full.data)
    .extract({ left: 0, top: 0, width: Math.min(iconSize + 10, full.info.width), height: iconSize })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  await sharp(icon)
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile("public/brand/goglobe-mark.png");

  // Favicons / app icons from the mark, centered on a transparent square.
  const square = async (size, out, pad = 0.08) => {
    const inner = Math.round(size * (1 - pad * 2));
    const resized = await sharp(icon)
      .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resized, gravity: "center" }])
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(out);
  };
  await square(512, "src/app/icon.png");
  await square(180, "src/app/apple-icon.png", 0.12);

  console.log(`logo ${full.info.width}x${full.info.height}, mark ${iconSize}px`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
