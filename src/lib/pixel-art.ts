interface PixelArtInput {
  commonName: string;
  scientificName: string;
}

interface FalImageResult {
  url?: string;
}

interface FalFluxLoraResponse {
  images?: FalImageResult[];
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : "";
}

function readLoraScale() {
  const raw = readEnv("FAL_PIXEL_ART_LORA_SCALE");

  if (!raw) {
    return 1;
  }

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function isPixelArtConfigured() {
  return Boolean(readEnv("FAL_KEY") && readEnv("FAL_PIXEL_ART_LORA_URL"));
}

export function buildPixelArtPrompt({
  commonName,
  scientificName,
}: PixelArtInput) {
  const triggerWord = readEnv("FAL_PIXEL_ART_TRIGGER_WORD");
  const subject = scientificName
    ? `${commonName} (${scientificName})`
    : commonName;

  return [
    `A retro 8-bit pixel art illustration of ${subject}.`,
    triggerWord ? `In the style of ${triggerWord}.` : null,
    "Full body creature sprite, centered composition, readable silhouette.",
    "Thick chunky black outlines, flat solid colors, no gradients, no painterly shading.",
    "Pure white background, no scenery, no text, no border, polished game card art.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generatePixelArtImage(input: PixelArtInput) {
  const key = readEnv("FAL_KEY");
  const loraUrl = readEnv("FAL_PIXEL_ART_LORA_URL");

  if (!key || !loraUrl) {
    return "";
  }

  const modelId = readEnv("FAL_PIXEL_ART_MODEL_ID") || "fal-ai/flux-lora";
  const response = await fetch(`https://fal.run/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildPixelArtPrompt(input),
      image_size: "square",
      num_images: 1,
      output_format: "png",
      loras: [{ path: loraUrl, scale: readLoraScale() }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `fal pixel art request failed (${response.status}): ${errorBody.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as FalFluxLoraResponse;
  return data.images?.[0]?.url ?? "";
}
