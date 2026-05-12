import {
  endOfMonth,
  endOfWeek,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";

import { rarityColors, rarityOrder, rarityXp } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CaptureFailurePayload,
  CaptureRejectReason,
  CaptureResult,
  ChallengeTemplateRecord,
  Confidence,
  EnvironmentType,
  Rarity,
  SpeciesCardRecord,
  UserChallengeProgressRecord,
  UserCollectionRecord,
  UserRecord,
} from "@/lib/types";

type DbUserRow = {
  id: string;
  email: string;
  google_name: string | null;
  display_name: string;
  avatar_id: string;
  friend_code: string;
  total_xp: number;
  environment_type: EnvironmentType;
  onboarding_complete: boolean;
  created_at: string;
};

type DbSpeciesCardRow = {
  id: string;
  gbif_taxon_key: number;
  common_name: string;
  scientific_name: string;
  kingdom: string;
  phylum: string;
  class_name: string;
  order_name: string;
  family: string;
  genus: string;
  species: string;
  rarity: Rarity;
  xp_value: number;
  photo_url: string | null;
  photo_source: "inaturalist" | "gbif" | "wikipedia" | "silhouette";
  lore: string | null;
  occurrence_count: number;
  created_at: string;
};

type DbUserCollectionRow = {
  id: string;
  user_id: string;
  species_card_id: string;
  gbif_taxon_key: number;
  rarity: Rarity;
  xp_awarded: number;
  captured_image_url: string | null;
  captured_at: string;
  capture_lat: number | null;
  capture_lng: number | null;
  capture_location_label: string | null;
  country_code: string | null;
};

type DbChallengeRow = {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "achievement";
  environment_type: EnvironmentType | "any";
  xp_reward: number;
  target_count: number;
  condition_type: string;
};

type DbChallengeProgressRow = {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  assigned_at: string;
  expires_at: string | null;
};

const invalidMessages: Record<CaptureRejectReason, string> = {
  photo_of_screen:
    "That looks like a screen, not a real field capture. Try spotting the real thing outdoors.",
  illustration:
    "That looks illustrated rather than photographed. Try a real creature or plant in natural light.",
  no_organism:
    "No animal or plant detected in this photo.",
  toy_or_statue:
    "Nice try, but props and statues do not count as wild captures.",
};

function mapUserRow(row: DbUserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    googleName: row.google_name ?? row.display_name,
    displayName: row.display_name,
    avatarId: row.avatar_id,
    friendCode: row.friend_code,
    totalXp: row.total_xp,
    environmentType: row.environment_type,
    onboardingComplete: row.onboarding_complete,
    createdAt: row.created_at,
  };
}

function mapSpeciesCardRow(row: DbSpeciesCardRow): SpeciesCardRecord {
  return {
    id: row.id,
    gbifTaxonKey: row.gbif_taxon_key,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    kingdom: row.kingdom,
    phylum: row.phylum,
    className: row.class_name,
    order: row.order_name,
    family: row.family,
    genus: row.genus,
    species: row.species,
    rarity: row.rarity,
    xpValue: row.xp_value,
    photoUrl: row.photo_url ?? "",
    photoSource: row.photo_source,
    lore: row.lore ?? "",
    occurrenceCount: row.occurrence_count,
    createdAt: row.created_at,
  };
}

function mapUserCollectionRow(row: DbUserCollectionRow): UserCollectionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    speciesCardId: row.species_card_id,
    gbifTaxonKey: row.gbif_taxon_key,
    rarity: row.rarity,
    xpAwarded: row.xp_awarded,
    capturedImageUrl: row.captured_image_url ?? "",
    capturedAt: row.captured_at,
    captureLat: row.capture_lat ?? 0,
    captureLng: row.capture_lng ?? 0,
    captureLocationLabel: row.capture_location_label ?? "",
    countryCode: row.country_code ?? "",
  };
}

function mapChallengeRow(row: DbChallengeRow): ChallengeTemplateRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    environmentType: row.environment_type,
    xpReward: row.xp_reward,
    targetCount: row.target_count,
    conditionType: row.condition_type,
  };
}

function mapChallengeProgressRow(
  row: DbChallengeProgressRow,
): UserChallengeProgressRecord {
  return {
    id: row.id,
    userId: row.user_id,
    challengeId: row.challenge_id,
    progress: row.progress,
    completed: row.completed,
    completedAt: row.completed_at,
    assignedAt: row.assigned_at,
    expiresAt: row.expires_at,
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function generateFriendCode(supabase: SupabaseClient) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  while (true) {
    const code = Array.from({ length: 6 }, () => {
      const offset = Math.floor(Math.random() * charset.length);
      return charset[offset];
    }).join("");

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("friend_code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }
}

async function getUserRowById(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DbUserRow | null;
}

async function getUserCollectionsWithCards(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_collections")
    .select("*, species_cards(*)")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<
    DbUserCollectionRow & { species_cards: DbSpeciesCardRow | null }
  >;

  return rows.map((row) => {
    const collection = mapUserCollectionRow(row);
    const cardRow = row.species_cards;
    return {
      collection,
      card: cardRow ? mapSpeciesCardRow(cardRow) : null,
    };
  });
}

async function getXpWithinWindow(
  supabase: SupabaseClient,
  userId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await supabase
    .from("xp_events")
    .select("amount, created_at")
    .eq("user_id", userId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{ amount: number | null }>;
  return rows.reduce<number>((sum, event) => sum + (event.amount ?? 0), 0);
}

async function getCaptureCountWithinWindow(
  supabase: SupabaseClient,
  userId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await supabase
    .from("user_collections")
    .select("id, captured_at")
    .eq("user_id", userId)
    .gte("captured_at", from.toISOString())
    .lte("captured_at", to.toISOString());

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}

async function getCurrentStreak(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_collections")
    .select("captured_at")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{ captured_at: string }>;
  const dateValues = new Set<string>(
    rows.map((collection) =>
      startOfDay(new Date(collection.captured_at)).toISOString(),
    ),
  );
  const dates = Array.from(dateValues)
    .map((value) => new Date(value))
    .sort((left, right) => right.getTime() - left.getTime());

  if (dates.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = startOfDay(new Date());

  while (true) {
    const match = dates.find((entry) => isSameDay(entry, cursor));

    if (!match) {
      if (streak === 0) {
        cursor = subDays(cursor, 1);
        const yesterdayMatch = dates.find((entry) => isSameDay(entry, cursor));
        if (!yesterdayMatch) {
          return 0;
        }
        streak += 1;
        cursor = subDays(cursor, 1);
        continue;
      }
      return streak;
    }

    streak += 1;
    cursor = subDays(cursor, 1);
  }
}

function rarityIndex(rarity: Rarity) {
  return rarityOrder.indexOf(rarity);
}

export function getRarityFromOccurrence(count: number): Rarity {
  if (count > 1_000_000) {
    return "common";
  }
  if (count > 100_000) {
    return "uncommon";
  }
  if (count > 10_000) {
    return "rare";
  }
  if (count > 1_000) {
    return "epic";
  }
  return "legendary";
}

// ---------------------------------------------------------------------------
// GBIF API — Taxonomy validation & enrichment (PRD §7.4)
// ---------------------------------------------------------------------------

interface GbifMatchResult {
  usageKey: number;
  scientificName: string;
  canonicalName: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  matchType: "EXACT" | "FUZZY" | "HIGHERRANK" | "NONE";
}

async function matchSpeciesWithGbif(
  scientificName: string,
): Promise<GbifMatchResult | null> {
  try {
    console.log(`[GBIF] 🔍 Matching species: "${scientificName}"`);
    const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&verbose=true`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[GBIF] ❌ Match request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.matchType === "NONE" || !data.usageKey) {
      console.warn(`[GBIF] ⚠️ No match found (matchType: ${data.matchType})`);
      return null;
    }

    console.log(`[GBIF] ✅ Match found: ${data.canonicalName} (key: ${data.usageKey}, type: ${data.matchType})`);
    console.log(`[GBIF]    Taxonomy: ${data.kingdom} > ${data.phylum} > ${data.class} > ${data.order} > ${data.family}`);

    return {
      usageKey: data.usageKey as number,
      scientificName: (data.scientificName as string) ?? scientificName,
      canonicalName: (data.canonicalName as string) ?? scientificName,
      kingdom: (data.kingdom as string) ?? "Unknown",
      phylum: (data.phylum as string) ?? "Unknown",
      class: (data.class as string) ?? "Unknown",
      order: (data.order as string) ?? "Unknown",
      family: (data.family as string) ?? "Unknown",
      genus: (data.genus as string) ?? "Unknown",
      species: (data.species as string) ?? "",
      matchType: data.matchType as GbifMatchResult["matchType"],
    };
  } catch (error) {
    console.error("[GBIF] ❌ Match error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// GBIF — Regional occurrence count for rarity (PRD §7.7)
// ---------------------------------------------------------------------------

async function fetchGbifRegionalOccurrence(
  taxonKey: number,
  countryCode: string,
): Promise<number> {
  try {
    console.log(`[GBIF] 📊 Fetching occurrence count for taxon ${taxonKey} in ${countryCode}...`);
    const url = `https://api.gbif.org/v1/occurrence/count?taxonKey=${taxonKey}&country=${countryCode}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[GBIF] ❌ Occurrence count failed: ${response.status}`);
      return 0;
    }

    const count = await response.json();
    const result = typeof count === "number" ? count : 0;
    console.log(`[GBIF] 📊 Regional occurrence: ${result.toLocaleString()} observations`);
    return result;
  } catch (error) {
    console.error("[GBIF] ❌ Occurrence count error:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Photo Fallback Chain (PRD §7.6):
// 1. iNaturalist  2. GBIF Media  3. Wikipedia  4. Silhouette
// ---------------------------------------------------------------------------

interface PhotoResult {
  photoUrl: string;
  photoSource: "inaturalist" | "gbif" | "wikipedia" | "silhouette";
}

async function fetchInatPhoto(scientificName: string): Promise<string | null> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&per_page=1`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{
        default_photo?: { medium_url?: string };
      }>;
    };

    return data.results?.[0]?.default_photo?.medium_url ?? null;
  } catch {
    return null;
  }
}

async function fetchGbifPhoto(scientificName: string): Promise<string | null> {
  try {
    const url = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&mediaType=StillImage&limit=1`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{
        media?: Array<Array<{ identifier?: string }>>;
      }>;
    };

    return data.results?.[0]?.media?.[0]?.[0]?.identifier ?? null;
  } catch {
    return null;
  }
}

interface WikiSummary {
  thumbnail?: { source?: string };
  extract?: string;
}

async function fetchWikipediaSummary(
  scientificName: string,
): Promise<WikiSummary | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    return (await response.json()) as WikiSummary;
  } catch {
    return null;
  }
}

async function fetchSpeciesPhoto(scientificName: string): Promise<PhotoResult> {
  console.log(`[Photo] 📷 Searching photo for "${scientificName}"...`);

  // 1. iNaturalist
  const inatUrl = await fetchInatPhoto(scientificName);
  if (inatUrl) {
    console.log(`[Photo] ✅ Found on iNaturalist: ${inatUrl.slice(0, 80)}...`);
    return { photoUrl: inatUrl, photoSource: "inaturalist" };
  }
  console.log(`[Photo]    iNaturalist: not found, trying GBIF...`);

  // 2. GBIF Media
  const gbifUrl = await fetchGbifPhoto(scientificName);
  if (gbifUrl) {
    console.log(`[Photo] ✅ Found on GBIF: ${gbifUrl.slice(0, 80)}...`);
    return { photoUrl: gbifUrl, photoSource: "gbif" };
  }
  console.log(`[Photo]    GBIF Media: not found, trying Wikipedia...`);

  // 3. Wikipedia thumbnail
  const wiki = await fetchWikipediaSummary(scientificName);
  if (wiki?.thumbnail?.source) {
    console.log(`[Photo] ✅ Found on Wikipedia: ${wiki.thumbnail.source.slice(0, 80)}...`);
    return { photoUrl: wiki.thumbnail.source, photoSource: "wikipedia" };
  }

  // 4. Fallback silhouette
  console.log(`[Photo] ⚠️ No photo found, using silhouette fallback`);
  return { photoUrl: "", photoSource: "silhouette" };
}

// ---------------------------------------------------------------------------
// Wikipedia — Lore / description text (PRD §7.6 step 3)
// ---------------------------------------------------------------------------

async function fetchWikipediaLore(scientificName: string): Promise<string> {
  const wiki = await fetchWikipediaSummary(scientificName);
  if (wiki?.extract) {
    // Trim to ~2-3 sentences for the card lore
    const sentences = wiki.extract.split(/(?<=\.)\s+/);
    return sentences.slice(0, 3).join(" ");
  }
  return "";
}

// ---------------------------------------------------------------------------
// Dynamic species resolution — full pipeline per PRD §7.4–7.6
// ---------------------------------------------------------------------------

interface ResolvedSpecies {
  gbifTaxonKey: number;
  commonName: string;
  scientificName: string;
  kingdom: string;
  phylum: string;
  className: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  photoUrl: string;
  photoSource: "inaturalist" | "gbif" | "wikipedia" | "silhouette";
  lore: string;
  occurrenceCount: number;
}

async function resolveSpeciesFromAPIs(
  commonName: string,
  scientificName: string,
  countryCode: string,
): Promise<ResolvedSpecies | null> {
  // Step 1: GBIF taxonomy match
  const gbifMatch = await matchSpeciesWithGbif(scientificName);

  if (!gbifMatch) {
    console.error(`[Pipeline] GBIF returned no match for "${scientificName}"`);
    return null;
  }

  // Step 2: Get regional occurrence count for rarity
  const occurrenceCount = await fetchGbifRegionalOccurrence(
    gbifMatch.usageKey,
    countryCode,
  );

  // Step 3: Fetch photo (fallback chain)
  const photo = await fetchSpeciesPhoto(gbifMatch.canonicalName);

  // Step 4: Fetch lore from Wikipedia
  let lore = await fetchWikipediaLore(gbifMatch.canonicalName);
  if (!lore) {
    // Try with common name as fallback
    lore = await fetchWikipediaLore(commonName);
  }

  return {
    gbifTaxonKey: gbifMatch.usageKey,
    commonName,
    scientificName: gbifMatch.canonicalName,
    kingdom: gbifMatch.kingdom,
    phylum: gbifMatch.phylum,
    className: gbifMatch.class,
    order: gbifMatch.order,
    family: gbifMatch.family,
    genus: gbifMatch.genus,
    species: gbifMatch.species ?? gbifMatch.canonicalName.split(" ").pop() ?? "",
    photoUrl: photo.photoUrl,
    photoSource: photo.photoSource,
    lore,
    occurrenceCount,
  };
}

// ---------------------------------------------------------------------------
// Upsert species card — creates or reuses global species_cards entry (PRD §7.9)
// ---------------------------------------------------------------------------

async function ensureSpeciesCard(
  supabase: SupabaseClient,
  resolved: ResolvedSpecies,
): Promise<SpeciesCardRecord> {
  // Check if species already exists by GBIF taxon key
  const { data: existing, error: findError } = await supabase
    .from("species_cards")
    .select("*")
    .eq("gbif_taxon_key", resolved.gbifTaxonKey)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return mapSpeciesCardRow(existing as DbSpeciesCardRow);
  }

  // Determine base rarity from occurrence for the card record
  const baseRarity = getRarityFromOccurrence(resolved.occurrenceCount);

  // Insert new species card
  const { data: inserted, error: insertError } = await supabase
    .from("species_cards")
    .insert({
      gbif_taxon_key: resolved.gbifTaxonKey,
      common_name: resolved.commonName,
      scientific_name: resolved.scientificName,
      kingdom: resolved.kingdom,
      phylum: resolved.phylum,
      class_name: resolved.className,
      order_name: resolved.order,
      family: resolved.family,
      genus: resolved.genus,
      species: resolved.species,
      rarity: baseRarity,
      xp_value: rarityXp[baseRarity],
      photo_url: resolved.photoUrl || null,
      photo_source: resolved.photoSource,
      lore: resolved.lore || null,
      occurrence_count: resolved.occurrenceCount,
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return mapSpeciesCardRow(inserted as DbSpeciesCardRow);
}

function inferLocation(lat?: number, lng?: number) {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return {
      environmentType: "urban" as EnvironmentType,
      countryCode: "IN",
      label: "Bengaluru Field Notes",
    };
  }

  const regions = [
    {
      label: "Bengaluru Field Notes",
      countryCode: "IN",
      environmentType: "urban" as EnvironmentType,
      lat: 12.9716,
      lng: 77.5946,
      radius: 0.8,
    },
    {
      label: "Delhi Garden Belt",
      countryCode: "IN",
      environmentType: "urban" as EnvironmentType,
      lat: 28.6139,
      lng: 77.209,
      radius: 0.8,
    },
    {
      label: "London Edge Path",
      countryCode: "GB",
      environmentType: "urban" as EnvironmentType,
      lat: 51.5072,
      lng: -0.1276,
      radius: 0.9,
    },
    {
      label: "Yellowstone Valley",
      countryCode: "US",
      environmentType: "rural" as EnvironmentType,
      lat: 44.428,
      lng: -110.5885,
      radius: 1.5,
    },
  ];

  const nearest =
    regions.find(
      (region) =>
        Math.abs(region.lat - lat) < region.radius &&
        Math.abs(region.lng - lng) < region.radius,
    ) ??
    ({
      label: lat > 20 ? "Open Range" : "Monsoon Verge",
      countryCode: lat > 20 ? "US" : "IN",
      environmentType: lat > 20 ? "rural" : "urban",
    } as const);

  return nearest;
}

async function findSpeciesByName(
  supabase: SupabaseClient,
  commonName: string,
  scientificName: string,
) {
  const { data: commonMatch, error: commonError } = await supabase
    .from("species_cards")
    .select("*")
    .ilike("common_name", commonName)
    .maybeSingle();

  if (commonError) {
    throw commonError;
  }

  if (commonMatch) {
    return mapSpeciesCardRow(commonMatch as DbSpeciesCardRow);
  }

  const { data: scientificMatch, error: scientificError } = await supabase
    .from("species_cards")
    .select("*")
    .ilike("scientific_name", scientificName)
    .maybeSingle();

  if (scientificError) {
    throw scientificError;
  }

  return scientificMatch ? mapSpeciesCardRow(scientificMatch as DbSpeciesCardRow) : null;
}

async function identifyWithGemini(imageData: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Gemini] 🚀 Starting species identification...`);
  console.log(`[Gemini]    Image size: ${Math.round(imageData.length / 1024)}KB`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured.");
  }

  const rawBase64 = imageData.split(",")[1];

  if (!rawBase64) {
    throw new Error("Invalid image data.");
  }

  console.log(`[Gemini] 📡 Sending request to Gemini 2.5 Flash...`);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: rawBase64,
                },
              },
              {
                // TODO: Re-add screen detection line before production!
                text: `You are a wildlife species identification expert and fraud detection system.

Analyze this image carefully. Determine if a real animal, plant, or organism is visible.

REJECT the image if:
- It is a drawing, illustration, painting, or cartoon
- It is a stuffed animal, toy, or statue
- No organism is visible

If an organism is visible, identify the species.

Respond ONLY in JSON. If invalid, return {"valid_capture": false, "reason": "illustration" | "no_organism" | "toy_or_statue"}.

If valid, return {"valid_capture": true, "common_name": "...", "scientific_name": "...", "confidence": "high" | "medium" | "low", "kingdom": "...", "class": "..."}.
`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(
      `[Gemini] Request failed: ${response.status} ${response.statusText}`,
      errorBody.slice(0, 500),
    );

    // Retry once on transient failures (rate limit or server error).
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const retry = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: "image/jpeg", data: rawBase64 } },
                  {
                    // TODO: Re-add screen detection line before production!
                    text: `You are a wildlife species identification expert and fraud detection system.

Analyze this image carefully. Determine if a real animal, plant, or organism is visible.

REJECT the image if:
- It is a drawing, illustration, painting, or cartoon
- It is a stuffed animal, toy, or statue
- No organism is visible

If an organism is visible, identify the species.

Respond ONLY in JSON. If invalid, return {"valid_capture": false, "reason": "illustration" | "no_organism" | "toy_or_statue"}.

If valid, return {"valid_capture": true, "common_name": "...", "scientific_name": "...", "confidence": "high" | "medium" | "low", "kingdom": "...", "class": "..."}.
`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!retry.ok) {
        throw new Error(
          `Gemini request failed after retry (${retry.status}).`,
        );
      }

      return handleGeminiResponse(retry);
    }

    throw new Error(
      `Gemini request failed (${response.status}): ${errorBody.slice(0, 200)}`,
    );
  }

  return handleGeminiResponse(response);
}

type GeminiResult =
  | { valid_capture: false; reason: CaptureRejectReason }
  | {
      valid_capture: true;
      common_name: string;
      scientific_name: string;
      confidence: Confidence;
      kingdom: string;
      class: string;
    };

async function handleGeminiResponse(response: Response): Promise<GeminiResult> {
  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error(`[Gemini] ❌ Empty response from Gemini`);
    throw new Error("Gemini returned an empty response.");
  }

  // Strip markdown fencing that Gemini sometimes adds.
  text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  console.log(`[Gemini] 📝 Raw response: ${text}`);

  try {
    const result = JSON.parse(text) as GeminiResult;
    if (result.valid_capture) {
      console.log(`[Gemini] ✅ Valid capture: "${result.common_name}" (${result.scientific_name}), confidence: ${result.confidence}`);
    } else {
      console.log(`[Gemini] ❌ Invalid capture: reason = ${result.reason}`);
    }
    return result;
  } catch {
    console.error("[Gemini] ❌ Invalid JSON:", text.slice(0, 300));
    throw new Error("Gemini returned invalid JSON.");
  }
}

async function saveCaptureImage(userId: string, imageData: string) {
  const base64 = imageData.split(",")[1];

  if (!base64) {
    throw new Error("Invalid image data.");
  }

  const filename = `${userId}-${Date.now()}.jpg`;
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase.storage
    .from("captures")
    .upload(filename, Buffer.from(base64, "base64"), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("captures").getPublicUrl(filename);
  return data.publicUrl;
}

async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  source: "capture" | "challenge" | "achievement",
  label: string,
  createdAt: string,
) {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("total_xp")
    .eq("id", userId)
    .single();

  if (userError) {
    throw userError;
  }

  await supabase.from("xp_events").insert({
    id: uid("xp"),
    user_id: userId,
    source,
    amount,
    label,
    created_at: createdAt,
  });

  await supabase
    .from("users")
    .update({ total_xp: (userRow?.total_xp ?? 0) + amount })
    .eq("id", userId);
}

function nextUtcMidnight(reference: Date) {
  const next = new Date(reference);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}

function nextUtcMonday(reference: Date) {
  const weekEnd = endOfWeek(reference, { weekStartsOn: 1 });
  const next = new Date(weekEnd);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}

function chooseChallenges(
  templates: ChallengeTemplateRecord[],
  type: "daily" | "weekly",
  environmentType: EnvironmentType,
) {
  return templates
    .filter(
      (challenge) =>
        challenge.type === type &&
        (challenge.environmentType === "any" ||
          challenge.environmentType === environmentType),
    )
    .slice(0, 3);
}

async function ensureChallenges(supabase: SupabaseClient, user: UserRecord) {
  const now = new Date();
  const { data: templateRows, error: templateError } = await supabase
    .from("challenges")
    .select("*");

  if (templateError) {
    throw templateError;
  }

  const templateList = (templateRows ?? []) as DbChallengeRow[];
  const challenges = templateList.map((row) => mapChallengeRow(row));

  if (challenges.length === 0) {
    return;
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("user_challenge_progress")
    .select("*")
    .eq("user_id", user.id);

  if (progressError) {
    throw progressError;
  }

  const progressItems = ((progressRows ?? []) as DbChallengeProgressRow[]).map((row) =>
    mapChallengeProgressRow(row),
  );
  const templateById = new Map<string, ChallengeTemplateRecord>(
    challenges.map((challenge) => [challenge.id, challenge]),
  );

  const needsDaily = !progressItems.some((progress) => {
    const challenge = templateById.get(progress.challengeId);
    return (
      challenge?.type === "daily" &&
      progress.expiresAt &&
      new Date(progress.expiresAt) > now
    );
  });

  const needsWeekly = !progressItems.some((progress) => {
    const challenge = templateById.get(progress.challengeId);
    return (
      challenge?.type === "weekly" &&
      progress.expiresAt &&
      new Date(progress.expiresAt) > now
    );
  });

  const hasAchievements = progressItems.some((progress) => {
    const challenge = templateById.get(progress.challengeId);
    return challenge?.type === "achievement";
  });

  const inserts: Array<Partial<DbChallengeProgressRow>> = [];

  if (needsDaily) {
    chooseChallenges(challenges, "daily", user.environmentType).forEach((challenge) => {
      inserts.push({
        id: uid("challenge-progress"),
        user_id: user.id,
        challenge_id: challenge.id,
        progress: 0,
        completed: false,
        completed_at: null,
        assigned_at: now.toISOString(),
        expires_at: nextUtcMidnight(now),
      });
    });
  }

  if (needsWeekly) {
    chooseChallenges(challenges, "weekly", user.environmentType).forEach((challenge) => {
      inserts.push({
        id: uid("challenge-progress"),
        user_id: user.id,
        challenge_id: challenge.id,
        progress: 0,
        completed: false,
        completed_at: null,
        assigned_at: now.toISOString(),
        expires_at: nextUtcMonday(now),
      });
    });
  }

  if (!hasAchievements) {
    challenges
      .filter((challenge) => challenge.type === "achievement")
      .forEach((challenge) => {
        inserts.push({
          id: uid("challenge-progress"),
          user_id: user.id,
          challenge_id: challenge.id,
          progress: 0,
          completed: false,
          completed_at: null,
          assigned_at: now.toISOString(),
          expires_at: null,
        });
      });
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("user_challenge_progress").insert(inserts);

    if (error) {
      throw error;
    }
  }
}

function progressMatchesChallenge(
  conditionType: string,
  collection: UserCollectionRecord,
  card: SpeciesCardRecord,
  collections: UserCollectionRecord[],
  challenge: ChallengeTemplateRecord,
  cardLookup: Map<string, SpeciesCardRecord>,
) {
  if (conditionType === "capture_any") {
    return Math.min(collections.length, challenge.targetCount);
  }

  if (conditionType === "capture_distinct_class") {
    const classNames = new Set(
      collections
        .map((entry) =>
          entry.id === collection.id
            ? card.className
            : cardLookup.get(entry.speciesCardId)?.className,
        )
        .filter(Boolean),
    );
    return Math.min(classNames.size, challenge.targetCount);
  }

  if (conditionType.startsWith("capture_class:")) {
    const target = conditionType.split(":")[1];
    return card.className === target ? 1 : 0;
  }

  if (conditionType.startsWith("capture_rarity_min:")) {
    const target = conditionType.split(":")[1] as Rarity;
    return rarityIndex(collection.rarity) >= rarityIndex(target) ? 1 : 0;
  }

  if (conditionType.startsWith("capture_rarity_exact:")) {
    const target = conditionType.split(":")[1] as Rarity;
    return collection.rarity === target ? 1 : 0;
  }

  if (conditionType === "collect_all_rarities") {
    const rarities = new Set(collections.map((entry) => entry.rarity));
    rarities.add(collection.rarity);
    return rarities.size;
  }

  return 0;
}

async function applyChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
  collection: UserCollectionRecord,
  card: SpeciesCardRecord,
) {
  const { data: progressRows, error } = await supabase
    .from("user_challenge_progress")
    .select("*, challenge:challenges(*)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const { data: collectionRows, error: collectionError } = await supabase
    .from("user_collections")
    .select("*")
    .eq("user_id", userId);

  if (collectionError) {
    throw collectionError;
  }

  const collectionRowList = (collectionRows ?? []) as DbUserCollectionRow[];
  const cardIds = Array.from(
    new Set(collectionRowList.map((row) => row.species_card_id)),
  );
  const { data: cardRows, error: cardError } = await supabase
    .from("species_cards")
    .select("*")
    .in("id", cardIds.length > 0 ? cardIds : [""]);

  if (cardError) {
    throw cardError;
  }

  const cardLookup = new Map<string, SpeciesCardRecord>(
    ((cardRows ?? []) as DbSpeciesCardRow[]).map((row) => [
      row.id,
      mapSpeciesCardRow(row),
    ]),
  );

  const existingCollections = collectionRowList.map((row) =>
    mapUserCollectionRow(row),
  );

  const now = collection.capturedAt;

  const progressRowList = (progressRows ?? []) as Array<
    DbChallengeProgressRow & { challenge: DbChallengeRow | null }
  >;

  for (const row of progressRowList) {
    const challengeRow = row.challenge;

    if (!challengeRow) {
      continue;
    }

    const progress = mapChallengeProgressRow(row as DbChallengeProgressRow);
    const challenge = mapChallengeRow(challengeRow);

    if (progress.completed) {
      continue;
    }

    if (progress.expiresAt && new Date(progress.expiresAt) < new Date(now)) {
      continue;
    }

    const computedProgress = progressMatchesChallenge(
      challenge.conditionType,
      collection,
      card,
      existingCollections,
      challenge,
      cardLookup,
    );

    let nextProgress = progress.progress;
    if (challenge.conditionType === "capture_any") {
      nextProgress = Math.min(progress.progress + 1, challenge.targetCount);
    } else if (computedProgress > 0) {
      nextProgress = Math.max(progress.progress, computedProgress);
    }

    const completed = nextProgress >= challenge.targetCount;

    if (nextProgress !== progress.progress || completed !== progress.completed) {
      await supabase
        .from("user_challenge_progress")
        .update({
          progress: nextProgress,
          completed,
          completed_at: completed ? now : progress.completedAt,
        })
        .eq("id", progress.id);

      if (completed && !progress.completed) {
        await awardXp(
          supabase,
          userId,
          challenge.xpReward,
          challenge.type === "achievement" ? "achievement" : "challenge",
          challenge.title,
          now,
        );
      }
    }
  }
}

function cloneCardForCollection(card: SpeciesCardRecord, collection: UserCollectionRecord) {
  return {
    ...card,
    rarity: collection.rarity,
    xpValue: collection.xpAwarded,
  };
}

export async function ensureUserSetup(authUser: SupabaseUser) {
  const supabase = createSupabaseAdminClient();
  const existing = await getUserRowById(supabase, authUser.id);

  if (existing) {
    const user = mapUserRow(existing);
    await ensureChallenges(supabase, user);
    return user;
  }

  if (!authUser.email) {
    throw new Error("Supabase user is missing an email address.");
  }

  const displayName =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    authUser.email.split("@")[0] ??
    "Explorer";

  const friendCode = await generateFriendCode(supabase);

  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      email: authUser.email,
      google_name: displayName,
      display_name: displayName,
      avatar_id: "avatar-1",
      friend_code: friendCode,
      total_xp: 0,
      environment_type: "urban",
      onboarding_complete: false,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    // Handle race condition: another request may have created the row already.
    const retryRow = await getUserRowById(supabase, authUser.id);
    if (retryRow) {
      const user = mapUserRow(retryRow);
      await ensureChallenges(supabase, user);
      return user;
    }
    throw error;
  }

  const user = mapUserRow(inserted as DbUserRow);
  await ensureChallenges(supabase, user);
  return user;
}

export async function completeOnboarding(
  userId: string,
  payload: { displayName: string; avatarId: string },
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      display_name: payload.displayName,
      avatar_id: payload.avatarId,
      onboarding_complete: true,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapUserRow(data as DbUserRow);
}

export async function updateProfile(
  userId: string,
  payload: { displayName: string; avatarId: string },
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      display_name: payload.displayName,
      avatar_id: payload.avatarId,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapUserRow(data as DbUserRow);
}

export async function updateUserEnvironment(
  userId: string,
  payload: { lat?: number; lng?: number },
) {
  const supabase = createSupabaseAdminClient();
  const location = inferLocation(payload.lat, payload.lng);

  const { error } = await supabase
    .from("users")
    .update({ environment_type: location.environmentType })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return location;
}

export async function getHomeData(userId: string) {
  const supabase = createSupabaseAdminClient();
  const userRow = await getUserRowById(supabase, userId);
  if (!userRow) {
    throw new Error("User not found.");
  }

  const user = mapUserRow(userRow);
  const collections = await getUserCollectionsWithCards(supabase, userId);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);

  const { data: progressRows, error: progressError } = await supabase
    .from("user_challenge_progress")
    .select("*, challenge:challenges(*)")
    .eq("user_id", userId)
    .eq("completed", false);

  if (progressError) {
    throw progressError;
  }

  const progressRowList = (progressRows ?? []) as Array<
    DbChallengeProgressRow & { challenge: DbChallengeRow | null }
  >;

  const activeChallenges = progressRowList
    .map((row) => {
      const challenge = row.challenge;
      if (!challenge) {
        return null;
      }

      return {
        progress: mapChallengeProgressRow(row),
        challenge: mapChallengeRow(challenge),
      };
    })
    .filter((entry): entry is { progress: UserChallengeProgressRecord; challenge: ChallengeTemplateRecord } =>
      Boolean(entry),
    )
    .sort((left, right) => {
      if (!left.progress.expiresAt) {
        return 1;
      }
      if (!right.progress.expiresAt) {
        return -1;
      }
      return (
        new Date(left.progress.expiresAt).getTime() -
        new Date(right.progress.expiresAt).getTime()
      );
    });

  return {
    user,
    todayLabel: format(now, "EEEE, do MMM"),
    totalCards: collections.length,
    stats: {
      weeklyXp: await getXpWithinWindow(supabase, userId, weekStart, tomorrow),
      capturesToday: await getCaptureCountWithinWindow(
        supabase,
        userId,
        startOfDay(now),
        tomorrow,
      ),
      streak: await getCurrentStreak(supabase, userId),
    },
    recentCaptures: collections
      .filter((entry) => entry.card)
      .slice(0, 3)
      .map((entry) => ({
        collection: entry.collection,
        card: cloneCardForCollection(entry.card as SpeciesCardRecord, entry.collection),
      })),
    activeChallenge: activeChallenges[0]
      ? {
          id: activeChallenges[0].challenge.id,
          title: activeChallenges[0].challenge.title,
          description: activeChallenges[0].challenge.description,
          xpReward: activeChallenges[0].challenge.xpReward,
          progress: activeChallenges[0].progress.progress,
          targetCount: activeChallenges[0].challenge.targetCount,
          expiresLabel: activeChallenges[0].progress.expiresAt
            ? formatDistanceToNowStrict(new Date(activeChallenges[0].progress.expiresAt))
            : "Permanent",
        }
      : null,
  };
}

export async function getCollectionData(userId: string) {
  const supabase = createSupabaseAdminClient();
  const collections = await getUserCollectionsWithCards(supabase, userId);

  return collections
    .filter((entry) => entry.card)
    .map((entry) => ({
      collection: entry.collection,
      card: cloneCardForCollection(entry.card as SpeciesCardRecord, entry.collection),
    }));
}

export async function getChallengesData(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_challenge_progress")
    .select("*, challenge:challenges(*)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const progressRowList = (data ?? []) as Array<
    DbChallengeProgressRow & { challenge: DbChallengeRow | null }
  >;

  const progressItems = progressRowList
    .map((row) => {
      const challenge = row.challenge;
      if (!challenge) {
        return null;
      }

      return {
        progress: mapChallengeProgressRow(row),
        challenge: mapChallengeRow(challenge),
      };
    })
    .filter((entry): entry is { progress: UserChallengeProgressRecord; challenge: ChallengeTemplateRecord } =>
      Boolean(entry),
    );

  return {
    daily: progressItems.filter((entry) => entry.challenge.type === "daily"),
    weekly: progressItems.filter((entry) => entry.challenge.type === "weekly"),
    achievements: progressItems.filter((entry) => entry.challenge.type === "achievement"),
  };
}

export async function getLeaderboardData(
  userId: string,
  scope: "weekly" | "monthly" | "all-time",
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const periodStart =
    scope === "weekly"
      ? startOfWeek(now, { weekStartsOn: 1 })
      : scope === "monthly"
        ? startOfMonth(now)
        : null;
  const periodEnd =
    scope === "weekly"
      ? endOfWeek(now, { weekStartsOn: 1 })
      : scope === "monthly"
        ? endOfMonth(now)
        : null;

  const { data: userRows, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("onboarding_complete", true);

  if (userError) {
    throw userError;
  }

  const users = ((userRows ?? []) as DbUserRow[]).map((row) => mapUserRow(row));

  let xpByUser = new Map<string, number>();
  if (scope === "all-time" || !periodStart || !periodEnd) {
    xpByUser = new Map(users.map((user) => [user.id, user.totalXp]));
  } else {
    const { data: events, error: eventsError } = await supabase
      .from("xp_events")
      .select("user_id, amount, created_at")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    if (eventsError) {
      throw eventsError;
    }

    const eventRows = (events ?? []) as Array<{
      user_id: string;
      amount: number | null;
    }>;
    xpByUser = eventRows.reduce((map, event) => {
      const current = map.get(event.user_id) ?? 0;
      map.set(event.user_id, current + (event.amount ?? 0));
      return map;
    }, new Map<string, number>());
  }

  const { data: collectionRows, error: collectionError } = await supabase
    .from("user_collections")
    .select("user_id, rarity");

  if (collectionError) {
    throw collectionError;
  }

  const rarityByUser = new Map<string, Rarity | null>();
  const collectionRowList = (collectionRows ?? []) as Array<{
    user_id: string;
    rarity: Rarity;
  }>;

  for (const row of collectionRowList) {
    const userRarity = rarityByUser.get(row.user_id) ?? null;
    const next = row.rarity;
    if (!userRarity || rarityIndex(next) > rarityIndex(userRarity)) {
      rarityByUser.set(row.user_id, next);
    }
  }

  const rows = users
    .map((user) => ({
      user,
      xp: xpByUser.get(user.id) ?? 0,
      topRarity: rarityByUser.get(user.id) ?? null,
    }))
    .sort((left, right) => right.xp - left.xp)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return {
    rows,
    currentUser: rows.find((row) => row.user.id === userId) ?? null,
  };
}

export async function getProfileData(userId: string) {
  const supabase = createSupabaseAdminClient();
  const userRow = await getUserRowById(supabase, userId);
  if (!userRow) {
    throw new Error("User not found.");
  }

  const user = mapUserRow(userRow);
  const collections = await getUserCollectionsWithCards(supabase, userId);
  const leaderboard = (await getLeaderboardData(userId, "all-time")).rows;
  const breakdown = rarityOrder.map((rarity) => ({
    rarity,
    count: collections.filter((entry) => entry.collection.rarity === rarity).length,
    color: rarityColors[rarity],
  }));

  return {
    user,
    globalRank: leaderboard.find((entry) => entry.user.id === userId)?.rank ?? null,
    totalCards: collections.length,
    streak: await getCurrentStreak(supabase, userId),
    rarestCatch: collections
      .filter((entry): entry is { collection: UserCollectionRecord; card: SpeciesCardRecord } => entry.card !== null)
      .toSorted(
        (left, right) =>
          rarityIndex(right.collection.rarity) - rarityIndex(left.collection.rarity),
      )[0] ?? null,
    capturesThisWeek: await getCaptureCountWithinWindow(
      supabase,
      userId,
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      new Date(),
    ),
    breakdown,
  };
}

export async function processCapture(
  userId: string,
  payload: {
    imageData: string;
    lat?: number;
    lng?: number;
  },
): Promise<CaptureResult> {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Capture] 🎯 Starting capture pipeline for user: ${userId}`);
    console.log(`[Capture]    Location: lat=${payload.lat}, lng=${payload.lng}`);

    const analysis = await identifyWithGemini(payload.imageData);

    // TODO: Re-enable screen detection in the Gemini prompt before production!
    if (!analysis.valid_capture) {
      console.log(`[Capture] ❌ Invalid capture — reason: ${analysis.reason}`);
      return {
        kind: "invalid",
        reason: analysis.reason,
        message: invalidMessages[analysis.reason],
      };
    }

    if (analysis.confidence === "low") {
      console.log(`[Capture] ⚠️ Low confidence — aborting`);
      return {
        kind: "low_confidence",
        message: "Couldn't identify this one. Try getting closer or better lighting.",
      };
    }

    const supabase = createSupabaseAdminClient();
    const location = inferLocation(payload.lat, payload.lng);
    console.log(`[Capture] 📍 Inferred location: ${location.label} (${location.countryCode}, ${location.environmentType})`);

    // Step 1: Check if species already exists in our DB
    console.log(`[Capture] 🔍 Step 1: Checking DB for "${analysis.common_name}" / "${analysis.scientific_name}"...`);
    let species = await findSpeciesByName(
      supabase,
      analysis.common_name,
      analysis.scientific_name,
    );

    // Step 2: If not in DB, resolve dynamically via APIs
    if (!species) {
      console.log(`[Capture] 🌐 Step 2: Not in DB — resolving via GBIF + iNaturalist + Wikipedia...`);

      const resolved = await resolveSpeciesFromAPIs(
        analysis.common_name,
        analysis.scientific_name,
        location.countryCode,
      );

      if (!resolved) {
        console.log(`[Capture] ❌ API resolution failed — no GBIF match`);
        return {
          kind: "low_confidence",
          message: "Couldn't verify this species. Try getting closer or better lighting.",
        };
      }

      console.log(`[Capture] ✅ Resolved: ${resolved.commonName} (${resolved.scientificName})`);
      console.log(`[Capture]    Photo: ${resolved.photoSource} | Lore: ${resolved.lore ? resolved.lore.slice(0, 60) + '...' : '(none)'}`);
      console.log(`[Capture]    Occurrence: ${resolved.occurrenceCount.toLocaleString()}`);

      // Step 3: Create the species card
      console.log(`[Capture] 💾 Step 3: Upserting species card...`);
      species = await ensureSpeciesCard(supabase, resolved);
      console.log(`[Capture] ✅ Species card ready: id=${species.id}`);
    } else {
      console.log(`[Capture] ✅ Found in DB: id=${species.id}, "${species.commonName}"`);
    }

    const capturedImageUrl = await saveCaptureImage(userId, payload.imageData);
    console.log(`[Capture] 📸 Image saved: ${capturedImageUrl}`);

    // Step 4: Duplicate check
    console.log(`[Capture] 🔍 Step 4: Checking for duplicate (taxon key: ${species.gbifTaxonKey})...`);
    const { data: duplicateRow, error: duplicateError } = await supabase
      .from("user_collections")
      .select("*")
      .eq("user_id", userId)
      .eq("gbif_taxon_key", species.gbifTaxonKey)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicateRow) {
      console.log(`[Capture] ⚠️ Duplicate! Already in user's collection`);
      const duplicate = mapUserCollectionRow(duplicateRow as DbUserCollectionRow);
      return {
        kind: "duplicate",
        card: cloneCardForCollection(species, duplicate),
        collection: null,
        xpAwarded: 0,
      } satisfies CaptureResult;
    }

    // Step 5: Get live regional occurrence for rarity
    console.log(`[Capture] 📊 Step 5: Fetching regional rarity...`);
    const regionalOccurrence = await fetchGbifRegionalOccurrence(
      species.gbifTaxonKey,
      location.countryCode,
    );
    const effectiveOccurrence = regionalOccurrence > 0 ? regionalOccurrence : species.occurrenceCount;
    const rarity = getRarityFromOccurrence(effectiveOccurrence);
    const xpValue = rarityXp[rarity];
    console.log(`[Capture] ⭐ Rarity: ${rarity.toUpperCase()} (${effectiveOccurrence.toLocaleString()} occurrences) → ${xpValue} XP`);
    const now = new Date().toISOString();

    // Step 6: Create user collection entry
    console.log(`[Capture] 💾 Step 6: Creating collection entry...`);
    const { data: collectionRow, error: collectionError } = await supabase
      .from("user_collections")
      .insert({
        user_id: userId,
        species_card_id: species.id,
        gbif_taxon_key: species.gbifTaxonKey,
        rarity,
        xp_awarded: xpValue,
        captured_image_url: capturedImageUrl,
        captured_at: now,
        capture_lat: payload.lat ?? 12.9716,
        capture_lng: payload.lng ?? 77.5946,
        capture_location_label: location.label,
        country_code: location.countryCode,
      })
      .select("*")
      .single();

    if (collectionError) {
      throw collectionError;
    }

    const collection = mapUserCollectionRow(collectionRow as DbUserCollectionRow);
    await awardXp(supabase, userId, xpValue, "capture", species.commonName, now);
    await applyChallengeProgress(supabase, userId, collection, species);

    console.log(`[Capture] 🎉 SUCCESS! "${species.commonName}" captured as ${rarity.toUpperCase()} for ${xpValue} XP`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      kind: "new",
      card: cloneCardForCollection(species, collection),
      collection,
      xpAwarded: xpValue,
    } satisfies CaptureResult;
  } catch (error) {
    console.error(`[Capture] 💥 ERROR:`, error instanceof Error ? error.message : error);
    console.log(`${'='.repeat(60)}\n`);
    const fallback: CaptureFailurePayload = {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again.",
    };
    return fallback;
  }
}

