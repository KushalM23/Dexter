import sharp from "sharp";

/**
 * Compress an image buffer down to at most 1024×1024 and convert to JPEG at 85% quality.
 * Returns a base64-encoded string ready to be sent as `inline_data` to Gemini.
 */
export async function compressImage(buffer: Buffer): Promise<string> {
  const compressed = await sharp(buffer)
    .resize(1024, 1024, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  return compressed.toString("base64");
}
