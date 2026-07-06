import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
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

import { challengeCatalog } from "@/lib/challenge-catalog";
import { generateTailoredChallenges } from "@/lib/challenge-generator";
import { rarityColors, rarityOrder, rarityXp } from "@/lib/constants";
import { generatePixelArtImage, isPixelArtConfigured } from "@/lib/pixel-art";
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
  pixel_art_url: string | null;
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

const INVALID_CAPTURE_MESSAGE =
  "We could not verify a real animal in this shot. Plants and other non-animal subjects do not count.";
const CATCHABLE_KINGDOM = "Animalia";

function isCatchableKingdom(kingdom: string | null | undefined) {
  return kingdom?.trim().toLowerCase() === CATCHABLE_KINGDOM.toLowerCase();
}

function normalizeSpeciesName(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function unwrapJoinedRow<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function ensureChallengeTemplates(supabase: SupabaseClient) {
  const seedRows: DbChallengeRow[] = challengeCatalog.map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    environment_type: challenge.environmentType,
    xp_reward: challenge.xpReward,
    target_count: challenge.targetCount,
    condition_type: challenge.conditionType,
  }));

  const { data: insertedRows, error: seedError } = await supabase
    .from("challenges")
    .upsert(seedRows, { onConflict: "id" })
    .select("*");

  if (seedError) {
    throw seedError;
  }

  return ((insertedRows ?? seedRows) as DbChallengeRow[]).map((row) => row);
}

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
    pixelArtUrl: row.pixel_art_url ?? "",
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

type ChallengeProgressEntry = {
  progress: UserChallengeProgressRecord;
  challenge: ChallengeTemplateRecord;
};

const currentChallengeIds = new Set(challengeCatalog.map((challenge) => challenge.id));
const DAILY_ACTIVE_CHALLENGE_COUNT = 5;
const WEEKLY_ACTIVE_CHALLENGE_COUNT = 5;
const DAILY_BACKLOG_WINDOW_COUNT = 28;
const WEEKLY_BACKLOG_WINDOW_COUNT = 4;
const DAILY_ROTATION_ANCHOR = new Date(2026, 4, 25);
const WEEKLY_ROTATION_ANCHOR = new Date(2026, 4, 25);
const SUPABASE_PAGE_SIZE = 1000;

function challengeProgressGroupKey(progress: UserChallengeProgressRecord) {
  const expiresIso = progress.expiresAt ? new Date(progress.expiresAt).toISOString() : "permanent";
  return `${progress.challengeId}:${expiresIso}`;
}

function scheduledChallengeKey(
  challengeId: string,
  assignedAt: string,
  expiresAt: string | null,
) {
  const assignedIso = new Date(assignedAt).toISOString();
  const expiresIso = expiresAt ? new Date(expiresAt).toISOString() : "permanent";
  return `${challengeId}:${assignedIso}:${expiresIso}`;
}

function positiveModulo(value: number, divisor: number) {
  if (divisor === 0) {
    return 0;
  }

  return ((value % divisor) + divisor) % divisor;
}

function isChallengeActiveNow(progress: UserChallengeProgressRecord, now: Date) {
  const assignedAt = new Date(progress.assignedAt);
  if (Number.isNaN(assignedAt.getTime()) || assignedAt > now) {
    return false;
  }

  if (!progress.expiresAt) {
    return true;
  }

  const expiresAt = new Date(progress.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
}

function selectTimedChallengesForWindow(
  templates: ChallengeTemplateRecord[],
  type: "daily" | "weekly",
  windowStart: Date,
) {
  const pool = templates.filter((challenge) => challenge.type === type);
  const desiredCount =
    type === "daily" ? DAILY_ACTIVE_CHALLENGE_COUNT : WEEKLY_ACTIVE_CHALLENGE_COUNT;

  if (pool.length <= desiredCount) {
    return pool;
  }

  const windowOffset =
    type === "daily"
      ? differenceInCalendarDays(startOfDay(windowStart), startOfDay(DAILY_ROTATION_ANCHOR))
      : differenceInCalendarWeeks(
          startOfWeek(windowStart, { weekStartsOn: 1 }),
          startOfWeek(WEEKLY_ROTATION_ANCHOR, { weekStartsOn: 1 }),
          { weekStartsOn: 1 },
        );
  const startIndex = positiveModulo(windowOffset * desiredCount, pool.length);

  return Array.from({ length: desiredCount }, (_, index) => {
    return pool[(startIndex + index) % pool.length];
  });
}

function buildTimedChallengeSchedule(
  templates: ChallengeTemplateRecord[],
  type: "daily" | "weekly",
  now: Date,
) {
  const backlogWindowCount =
    type === "daily" ? DAILY_BACKLOG_WINDOW_COUNT : WEEKLY_BACKLOG_WINDOW_COUNT;
  const currentWindowStart =
    type === "daily" ? startOfDay(now) : startOfWeek(now, { weekStartsOn: 1 });

  return Array.from({ length: backlogWindowCount }, (_, offset) => {
    const windowStart =
      type === "daily"
        ? addDays(currentWindowStart, offset)
        : addWeeks(currentWindowStart, offset);
    const expiresAt =
      type === "daily" ? addDays(windowStart, 1) : addWeeks(windowStart, 1);

    return selectTimedChallengesForWindow(templates, type, windowStart).map((challenge) => ({
      challenge,
      assignedAt: windowStart.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }));
  }).flat();
}

function pickPreferredChallengeProgress(
  left: UserChallengeProgressRecord,
  right: UserChallengeProgressRecord,
) {
  if (left.completed !== right.completed) {
    return left.completed ? left : right;
  }

  if (left.progress !== right.progress) {
    return left.progress > right.progress ? left : right;
  }

  return new Date(left.assignedAt).getTime() <= new Date(right.assignedAt).getTime()
    ? left
    : right;
}

function pickEarlierDateString(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() <= new Date(right).getTime() ? left : right;
}

function pickEarlierRequiredDateString(left: string, right: string) {
  return new Date(left).getTime() <= new Date(right).getTime() ? left : right;
}

function dedupeChallengeProgressRecords(records: UserChallengeProgressRecord[]) {
  const uniqueRecords = new Map<string, UserChallengeProgressRecord>();

  for (const record of records) {
    const key = challengeProgressGroupKey(record);
    const existing = uniqueRecords.get(key);

    if (!existing) {
      uniqueRecords.set(key, record);
      continue;
    }

    const preferred = pickPreferredChallengeProgress(existing, record);

    uniqueRecords.set(key, {
      ...preferred,
      progress: Math.max(existing.progress, record.progress),
      completed: existing.completed || record.completed,
      completedAt: pickEarlierDateString(existing.completedAt, record.completedAt),
      assignedAt: pickEarlierRequiredDateString(existing.assignedAt, record.assignedAt),
      expiresAt: existing.expiresAt ?? record.expiresAt,
    });
  }

  return Array.from(uniqueRecords.values());
}

function dedupeChallengeProgressEntries(entries: ChallengeProgressEntry[]) {
  const challengeById = new Map(
    entries.map((entry) => [entry.challenge.id, entry.challenge] as const),
  );

  return dedupeChallengeProgressRecords(entries.map((entry) => entry.progress))
    .map((progress) => {
      const challenge = challengeById.get(progress.challengeId);
      if (!challenge) {
        return null;
      }

      return {
        progress,
        challenge,
      };
    })
    .filter((entry): entry is ChallengeProgressEntry => Boolean(entry));
}

function mergeChallengeProgressRecords(records: UserChallengeProgressRecord[]) {
  if (records.length === 0) {
    return null;
  }

  return records.slice(1).reduce((merged, record) => {
    const preferred = pickPreferredChallengeProgress(merged, record);

    return {
      ...preferred,
      progress: Math.max(merged.progress, record.progress),
      completed: merged.completed || record.completed,
      completedAt: pickEarlierDateString(merged.completedAt, record.completedAt),
      assignedAt: pickEarlierRequiredDateString(merged.assignedAt, record.assignedAt),
      expiresAt: merged.expiresAt ?? record.expiresAt,
    };
  }, records[0]);
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function currentLevelFromXp(totalXp: number) {
  return Math.floor(totalXp / 500) + 1;
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
    DbUserCollectionRow & { species_cards: DbSpeciesCardRow | DbSpeciesCardRow[] | null }
  >;

  return rows.flatMap((row) => {
    const cardRow = unwrapJoinedRow(row.species_cards);
    if (!cardRow || !isCatchableKingdom(cardRow.kingdom)) {
      return [];
    }

    return [
      {
        collection: mapUserCollectionRow(row),
        card: mapSpeciesCardRow(cardRow),
      },
    ];
  });
}

async function listAllUserChallengeProgressRows(supabase: SupabaseClient, userId: string) {
  const rows: DbChallengeProgressRow[] = [];

  for (let offset = 0; ; offset += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_id", userId)
      .order("assigned_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as DbChallengeProgressRow[];
    rows.push(...batch);

    if (batch.length < SUPABASE_PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

async function listAllUserChallengeProgressRowsWithChallenges(
  supabase: SupabaseClient,
  userId: string,
) {
  const rows: Array<DbChallengeProgressRow & { challenge: DbChallengeRow | null }> = [];

  for (let offset = 0; ; offset += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("user_challenge_progress")
      .select("*, challenge:challenges(*)")
      .eq("user_id", userId)
      .order("assigned_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as Array<
      DbChallengeProgressRow & { challenge: DbChallengeRow | null }
    >;
    rows.push(...batch);

    if (batch.length < SUPABASE_PAGE_SIZE) {
      break;
    }
  }

  return rows;
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
  const collections = await getUserCollectionsWithCards(supabase, userId);
  return collections.filter(
    (entry) =>
      new Date(entry.collection.capturedAt).getTime() >= from.getTime() &&
      new Date(entry.collection.capturedAt).getTime() <= to.getTime(),
  ).length;
}

async function getCurrentStreak(supabase: SupabaseClient, userId: string) {
  const collections = await getUserCollectionsWithCards(supabase, userId);
  const dateValues = new Set<string>(
    collections.map((entry) =>
      startOfDay(new Date(entry.collection.capturedAt)).toISOString(),
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

// ---------------------------------------------------------------------------
// Domesticated / ubiquitous species override (always "common")
// GBIF observation counts are meaningless for these â€” nobody uploads research
// observations of their pet dog or themselves to a biodiversity database.
// ---------------------------------------------------------------------------
const ALWAYS_COMMON_SPECIES = new Set([
  "homo sapiens",
  "canis lupus familiaris",
  "canis familiaris",
  "felis catus",
  "felis silvestris catus",
  "columba livia domestica",
  "rattus rattus",
  "rattus norvegicus",
  "mus musculus",
  "bos taurus",
  "bos indicus",
  "gallus gallus domesticus",
  "bubalus bubalis",
  "capra aegagrus hircus",
  "ovis aries",
  "sus domesticus",
  "equus caballus",
]);

export function getRarityFromOccurrence(
  count: number,
  scientificName?: string,
): Rarity {
  // Domesticated / ubiquitous species are always common regardless of GBIF data
  if (scientificName && ALWAYS_COMMON_SPECIES.has(scientificName.toLowerCase())) {
    return "common";
  }

  // Thresholds calibrated against real GBIF country-level data for India:
  //   House Sparrow ~507K, House Crow ~1.2M, Pigeon ~1.1M = Common
  //   Bengal Tiger ~4.6K, Spotted Deer ~3.5K = Uncommon
  //   Indian Cobra ~1.8K = Uncommon
  //   Truly rare wildlife < 100 = Legendary
  if (count > 100_000) {
    return "common";
  }
  if (count > 10_000) {
    return "uncommon";
  }
  if (count > 1_000) {
    return "rare";
  }
  if (count > 100) {
    return "epic";
  }
  return "legendary";
}

// ---------------------------------------------------------------------------
// GBIF API â€” Taxonomy validation & enrichment (PRD Â§7.4)
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
    console.log(`[GBIF] ðŸ” Matching species: "${scientificName}"`);
    const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&verbose=true`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[GBIF] âŒ Match request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.matchType === "NONE" || !data.usageKey) {
      console.warn(`[GBIF] âš ï¸ No match found (matchType: ${data.matchType})`);
      return null;
    }

    console.log(`[GBIF] âœ… Match found: ${data.canonicalName} (key: ${data.usageKey}, type: ${data.matchType})`);
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
    console.error("[GBIF] âŒ Match error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// GBIF â€” Regional occurrence count for rarity (PRD Â§7.7)
// ---------------------------------------------------------------------------

async function fetchGbifRegionalOccurrence(
  taxonKey: number,
  countryCode: string,
): Promise<number> {
  try {
    console.log(`[GBIF] ðŸ“Š Fetching occurrence count for taxon ${taxonKey} in ${countryCode}...`);
    const url = `https://api.gbif.org/v1/occurrence/count?taxonKey=${taxonKey}&country=${countryCode}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[GBIF] âŒ Occurrence count failed: ${response.status}`);
      return 0;
    }

    const count = await response.json();
    const result = typeof count === "number" ? count : 0;
    console.log(`[GBIF] ðŸ“Š Regional occurrence: ${result.toLocaleString()} observations`);
    return result;
  } catch (error) {
    console.error("[GBIF] ❌ Occurrence count error:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// GBIF — Vernacular (common) name lookup
// Fetches the preferred English common name from GBIF's checklist bank.
// Falls back to any English name, then any name at all.
// ---------------------------------------------------------------------------

async function fetchGbifVernacularName(
  taxonKey: number,
): Promise<string | null> {
  try {
    console.log(`[GBIF] 🏷️ Fetching vernacular name for taxon ${taxonKey}...`);
    const url = `https://api.gbif.org/v1/species/${taxonKey}/vernacularNames?limit=100`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[GBIF] ❌ Vernacular name request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        vernacularName?: string;
        language?: string;
        isPreferred?: boolean;
      }>;
    };

    const names = data.results ?? [];
    if (names.length === 0) {
      console.log(`[GBIF] ⚠️ No vernacular names found`);
      return null;
    }

    // Priority: preferred English > any English > first available
    const englishNames = names.filter(
      (n) => n.language?.toLowerCase() === "en" && n.vernacularName,
    );
    const preferred = englishNames.find((n) => n.isPreferred);
    const picked = preferred ?? englishNames[0] ?? names.find((n) => n.vernacularName);

    if (picked?.vernacularName) {
      console.log(`[GBIF] ✅ Vernacular name: "${picked.vernacularName}" (lang: ${picked.language}, preferred: ${picked.isPreferred ?? false})`);
      return picked.vernacularName;
    }

    console.log(`[GBIF] ⚠️ No usable vernacular name in results`);
    return null;
  } catch (error) {
    console.error("[GBIF] ❌ Vernacular name error:", error);
    return null;
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
  console.log(`[Photo] ðŸ“· Searching photo for "${scientificName}"...`);

  // 1. iNaturalist
  const inatUrl = await fetchInatPhoto(scientificName);
  if (inatUrl) {
    console.log(`[Photo] âœ… Found on iNaturalist: ${inatUrl.slice(0, 80)}...`);
    return { photoUrl: inatUrl, photoSource: "inaturalist" };
  }
  console.log(`[Photo]    iNaturalist: not found, trying GBIF...`);

  // 2. GBIF Media
  const gbifUrl = await fetchGbifPhoto(scientificName);
  if (gbifUrl) {
    console.log(`[Photo] âœ… Found on GBIF: ${gbifUrl.slice(0, 80)}...`);
    return { photoUrl: gbifUrl, photoSource: "gbif" };
  }
  console.log(`[Photo]    GBIF Media: not found, trying Wikipedia...`);

  // 3. Wikipedia thumbnail
  const wiki = await fetchWikipediaSummary(scientificName);
  if (wiki?.thumbnail?.source) {
    console.log(`[Photo] âœ… Found on Wikipedia: ${wiki.thumbnail.source.slice(0, 80)}...`);
    return { photoUrl: wiki.thumbnail.source, photoSource: "wikipedia" };
  }

  // 4. Fallback silhouette
  console.log(`[Photo] âš ï¸ No photo found, using silhouette fallback`);
  return { photoUrl: "", photoSource: "silhouette" };
}

// ---------------------------------------------------------------------------
// Wikipedia â€” Lore / description text (PRD Â§7.6 step 3)
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
// Dynamic species resolution â€” full pipeline per PRD Â§7.4â€“7.6
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

async function maybeGeneratePixelArt(
  commonName: string,
  scientificName: string,
) {
  if (!isPixelArtConfigured()) {
    return "";
  }

  try {
    console.log(`[PixelArt] ðŸŽ¨ Generating pixel art for "${commonName}"...`);
    const imageUrl = await generatePixelArtImage({ commonName, scientificName });

    if (imageUrl) {
      console.log(`[PixelArt] âœ… Generated pixel art: ${imageUrl.slice(0, 80)}...`);
    } else {
      console.log("[PixelArt] âš ï¸ Provider returned no image URL");
    }

    return imageUrl;
  } catch (error) {
    console.error(
      "[PixelArt] âŒ Generation failed:",
      error instanceof Error ? error.message : error,
    );
    return "";
  }
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

  if (!isCatchableKingdom(gbifMatch.kingdom)) {
    console.warn(
      `[Pipeline] Rejected non-animal GBIF match: ${gbifMatch.canonicalName} (${gbifMatch.kingdom})`,
    );
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
      photoUrl: "",
      photoSource: "silhouette",
      lore: "",
      occurrenceCount: 0,
    };
  }

  // Step 2: Get regional occurrence count for rarity
  const occurrenceCount = await fetchGbifRegionalOccurrence(
    gbifMatch.usageKey,
    countryCode,
  );

  // Step 3: Fetch authoritative common name from GBIF (Gemini name as fallback)
  const gbifVernacular = await fetchGbifVernacularName(gbifMatch.usageKey);
  const resolvedCommonName = gbifVernacular ?? commonName;
  if (gbifVernacular) {
    console.log(`[Pipeline] 🏷️ Using GBIF vernacular name: "${gbifVernacular}" (Gemini said: "${commonName}")`);
  } else {
    console.log(`[Pipeline] ⚠️ No GBIF vernacular name, falling back to Gemini: "${commonName}"`);
  }

  // Step 4: Fetch photo (fallback chain)
  const photo = await fetchSpeciesPhoto(gbifMatch.canonicalName);

  // Step 5: Fetch lore from Wikipedia
  let lore = await fetchWikipediaLore(gbifMatch.canonicalName);
  if (!lore) {
    // Try with common name as fallback
    lore = await fetchWikipediaLore(resolvedCommonName);
  }

  return {
    gbifTaxonKey: gbifMatch.usageKey,
    commonName: resolvedCommonName,
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
// Upsert species card â€” creates or reuses global species_cards entry (PRD Â§7.9)
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
    const existingRow = existing as DbSpeciesCardRow;

    if (!existingRow.pixel_art_url) {
      const pixelArtUrl = await maybeGeneratePixelArt(
        existingRow.common_name,
        existingRow.scientific_name,
      );

      if (pixelArtUrl) {
        const { error: updateError } = await supabase
          .from("species_cards")
          .update({ pixel_art_url: pixelArtUrl })
          .eq("id", existingRow.id);

        if (updateError) {
          console.error("[PixelArt] âŒ Failed to save generated art:", updateError);
        } else {
          existingRow.pixel_art_url = pixelArtUrl;
        }
      }
    }

    return mapSpeciesCardRow(existingRow);
  }

  // Determine base rarity from occurrence for the card record
  const baseRarity = getRarityFromOccurrence(resolved.occurrenceCount, resolved.scientificName);
  const pixelArtUrl = await maybeGeneratePixelArt(
    resolved.commonName,
    resolved.scientificName,
  );

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
      pixel_art_url: pixelArtUrl || null,
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
    .eq("kingdom", CATCHABLE_KINGDOM)
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
    .eq("kingdom", CATCHABLE_KINGDOM)
    .maybeSingle();

  if (scientificError) {
    throw scientificError;
  }

  return scientificMatch ? mapSpeciesCardRow(scientificMatch as DbSpeciesCardRow) : null;
}

async function identifyWithGemini(imageData: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Gemini] ðŸš€ Starting species identification...`);
  console.log(`[Gemini]    Raw image size: ${Math.round(imageData.length / 1024)}KB`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured.");
  }

  const rawBase64 = imageData.split(",")[1];

  if (!rawBase64) {
    throw new Error("Invalid image data.");
  }

  // --- Compress image with sharp before sending ---
  let compressedBase64: string;
  try {
    const { compressImage } = await import("@/lib/image-compress");
    const imageBuffer = Buffer.from(rawBase64, "base64");
    compressedBase64 = await compressImage(imageBuffer);
    console.log(`[Gemini] ðŸ—œï¸  Compressed image: ${Math.round(rawBase64.length / 1024)}KB â†’ ${Math.round(compressedBase64.length / 1024)}KB`);
  } catch (compressionError) {
    console.warn(`[Gemini] âš ï¸ Image compression failed, using original image:`, compressionError);
    compressedBase64 = rawBase64;
  }

  const identificationPrompt = `You are a wildlife species identification expert and fraud detection system.

Analyze this image carefully. Determine if a real animal is visible.

Only real animals count as valid captures for this app.
Humans count as animals and should be identified as Homo sapiens when present.

REJECT the image if:
- It is an AI generated image
- It is a drawing, illustration, painting, or cartoon
- It is a stuffed animal, toy, or statue
- No animal is visible
- The subject is a plant, fungus, or any other non-animal organism

If a real animal is visible, identify the species.

For the common name, use the SHORTEST and most widely-recognized colloquial name that a normal person would use.
- Use breed-specific names when recognizable (e.g. "Labrador Retriever", NOT "Common Dog, Labrador").
- Drop unnecessary prefixes like "Common", "Domestic", "Western" unless they are essential to distinguish the species (e.g. "House Sparrow" is fine, but "Common Pigeon" should just be "Pigeon").
- Keep it to 1-3 words maximum. Examples: "Labrador Retriever", "House Crow", "Bengal Tiger", "Goldfish", "Budgerigar".
- For domestic dog breeds, use the breed name (e.g. "Golden Retriever", "German Shepherd", "Pug"), NOT generic names like "Dog" or "Domestic Dog".
- For domestic cats, use the breed if identifiable (e.g. "Persian Cat", "Siamese"), otherwise just "Cat".

Respond ONLY in JSON. 

If invalid, return {"valid_capture": false, "reason": "illustration" | "non_animal" | "no_organism" | "toy_or_statue"}.

If valid, return {"valid_capture": true, "common_name": "...", "scientific_name": "...", "confidence": "high" | "medium" | "low", "kingdom": "...", "class": "..."}.
`;

  // --- Model fallback chain for rate-limit resilience ---
  return callGeminiWithFallback(apiKey, compressedBase64, identificationPrompt);
}

/**
 * Ordered fallback chain: try each model in sequence when the current one
 * returns HTTP 429 or a "quota exceeded" error.
 */
const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
] as const;

async function callGeminiWithFallback(
  apiKey: string,
  base64Image: string,
  prompt: string,
): Promise<GeminiResult> {
  for (let i = 0; i < GEMINI_FALLBACK_MODELS.length; i++) {
    const model = GEMINI_FALLBACK_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[Gemini] ðŸ“¡ Attempt ${i + 1}/${GEMINI_FALLBACK_MODELS.length} â€” using model: ${model}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        }),
      });

      if (response.ok) {
        console.log(`[Gemini] âœ… Model "${model}" responded successfully.`);
        return handleGeminiResponse(response);
      }

      // --- Check for rate-limit / quota errors ---
      const errorBody = await response.text().catch(() => "");
      const isRateLimit =
        response.status === 429 ||
        errorBody.toLowerCase().includes("quota") ||
        errorBody.toLowerCase().includes("rate limit") ||
        errorBody.toLowerCase().includes("resource_exhausted");

      if (isRateLimit) {
        console.warn(
          `[Gemini] âš ï¸ Rate limited on "${model}" (HTTP ${response.status}). ${
            i < GEMINI_FALLBACK_MODELS.length - 1
              ? `Falling back to "${GEMINI_FALLBACK_MODELS[i + 1]}"...`
              : "No more fallback models."
          }`,
        );
        console.warn(`[Gemini]    Error body: ${errorBody.slice(0, 300)}`);

        // Brief delay before trying the next model
        if (i < GEMINI_FALLBACK_MODELS.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        continue;
      }

      // Non-rate-limit error â€” fail immediately
      console.error(
        `[Gemini] âŒ Model "${model}" failed with HTTP ${response.status}: ${errorBody.slice(0, 300)}`,
      );
      throw new Error(
        `Gemini request failed (${response.status}): ${errorBody.slice(0, 200)}`,
      );
    } catch (error: unknown) {
      // Re-throw structured errors, catch network errors
      if (error instanceof Error && error.message.startsWith("Gemini")) {
        throw error;
      }
      console.error(`[Gemini] âŒ Network error on "${model}":`, error);
      throw error;
    }
  }

  // All models exhausted
  console.error(
    `[Gemini] ðŸš¨ All ${GEMINI_FALLBACK_MODELS.length} models exhausted. Models tried: ${GEMINI_FALLBACK_MODELS.join(", ")}`,
  );
  throw new Error(
    "Service temporarily unavailable. Please try again shortly.",
  );
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
    console.error(`[Gemini] âŒ Empty response from Gemini`);
    throw new Error("Gemini returned an empty response.");
  }

  // Strip markdown fencing that Gemini sometimes adds.
  text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  console.log(`[Gemini] ðŸ“ Raw response: ${text}`);

  try {
    const result = JSON.parse(text) as GeminiResult;
    if (result.valid_capture) {
      console.log(`[Gemini] âœ… Valid capture: "${result.common_name}" (${result.scientific_name}), confidence: ${result.confidence}`);
    } else {
      console.log(`[Gemini] âŒ Invalid capture: reason = ${result.reason}`);
    }
    return result;
  } catch {
    console.error("[Gemini] âŒ Invalid JSON:", text.slice(0, 300));
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

async function ensureChallenges(
  supabase: SupabaseClient,
  user: Pick<UserRecord, "id">,
) {
  const now = new Date();
  await ensureChallengeTemplates(supabase);
  
  // Load all challenges from database so we have both static catalog and generated ones
  const { data: dbChallenges, error: challengesError } = await supabase
    .from("challenges")
    .select("*");
  if (challengesError) {
    throw challengesError;
  }
  const challenges = (dbChallenges ?? []).map((row) => mapChallengeRow(row));

  if (challenges.length === 0) {
    return;
  }

  const templateById = new Map<string, ChallengeTemplateRecord>(
    challenges.map((challenge) => [challenge.id, challenge]),
  );
  const progressRows = await listAllUserChallengeProgressRows(supabase, user.id);

  // Get full user profile for generator requirements (level/environment)
  let fullUser: UserRecord;
  if ("environmentType" in user && "totalXp" in user) {
    fullUser = user as UserRecord;
  } else {
    const userRow = await getUserRowById(supabase, user.id);
    if (!userRow) {
      return;
    }
    fullUser = mapUserRow(userRow);
  }

  const desiredTimedSchedule: Array<{
    challenge: ChallengeTemplateRecord;
    assignedAt: string;
    expiresAt: string;
  }> = [];

  // 1. Dailies backlog windows
  const currentDailyWindowStart = startOfDay(now);
  for (let offset = 0; offset < DAILY_BACKLOG_WINDOW_COUNT; offset++) {
    const windowStart = addDays(currentDailyWindowStart, offset);
    const expiresAt = addDays(windowStart, 1);
    const windowStartStr = windowStart.toISOString();
    const expiresAtStr = expiresAt.toISOString();

    const existingAssignments = progressRows.filter(
      (row) => row.assigned_at === windowStartStr && row.expires_at === expiresAtStr
    );

    if (existingAssignments.length >= 5) {
      for (const row of existingAssignments) {
        const challenge = templateById.get(row.challenge_id);
        if (challenge) {
          desiredTimedSchedule.push({
            challenge,
            assignedAt: windowStartStr,
            expiresAt: expiresAtStr,
          });
        }
      }
    } else if (existingAssignments.length === 0) {
      const generated = await generateTailoredChallenges(supabase, fullUser, "daily", windowStart);
      desiredTimedSchedule.push(...generated);
      for (const item of generated) {
        templateById.set(item.challenge.id, item.challenge);
      }
    }
  }

  // 2. Weeklies backlog windows
  const currentWeeklyWindowStart = startOfWeek(now, { weekStartsOn: 1 });
  for (let offset = 0; offset < WEEKLY_BACKLOG_WINDOW_COUNT; offset++) {
    const windowStart = addWeeks(currentWeeklyWindowStart, offset);
    const expiresAt = addWeeks(windowStart, 1);
    const windowStartStr = windowStart.toISOString();
    const expiresAtStr = expiresAt.toISOString();

    const existingAssignments = progressRows.filter(
      (row) => row.assigned_at === windowStartStr && row.expires_at === expiresAtStr
    );

    if (existingAssignments.length >= 5) {
      for (const row of existingAssignments) {
        const challenge = templateById.get(row.challenge_id);
        if (challenge) {
          desiredTimedSchedule.push({
            challenge,
            assignedAt: windowStartStr,
            expiresAt: expiresAtStr,
          });
        }
      }
    } else if (existingAssignments.length === 0) {
      const generated = await generateTailoredChallenges(supabase, fullUser, "weekly", windowStart);
      desiredTimedSchedule.push(...generated);
      for (const item of generated) {
        templateById.set(item.challenge.id, item.challenge);
      }
    }
  }

  const desiredTimedScheduleByKey = new Map(
    desiredTimedSchedule.map((scheduledChallenge) => [
      scheduledChallengeKey(
        scheduledChallenge.challenge.id,
        scheduledChallenge.assignedAt,
        scheduledChallenge.expiresAt,
      ),
      scheduledChallenge,
    ] as const),
  );
  const groupedAchievementRows = new Map<string, DbChallengeProgressRow[]>();
  const groupedTimedRows = new Map<string, DbChallengeProgressRow[]>();
  const deleteIds = new Set<string>();
  const updates: Array<{ id: string; data: Partial<DbChallengeProgressRow> }> = [];
  const inserts: Array<Partial<DbChallengeProgressRow>> = [];

  for (const row of progressRows) {
    const challenge = templateById.get(row.challenge_id);
    if (!challenge) {
      deleteIds.add(row.id);
      continue;
    }

    if (challenge.type === "achievement") {
      const existing = groupedAchievementRows.get(challenge.id) ?? [];
      existing.push(row);
      groupedAchievementRows.set(challenge.id, existing);
      continue;
    }

    if (!row.expires_at) {
      deleteIds.add(row.id);
      continue;
    }

    const scheduleKey = scheduledChallengeKey(row.challenge_id, row.assigned_at, row.expires_at);
    if (!desiredTimedScheduleByKey.has(scheduleKey)) {
      deleteIds.add(row.id);
      continue;
    }

    const existing = groupedTimedRows.get(scheduleKey) ?? [];
    existing.push(row);
    groupedTimedRows.set(scheduleKey, existing);
  }

  for (const challenge of challenges.filter((entry) => entry.type === "achievement")) {
    const rows = groupedAchievementRows.get(challenge.id) ?? [];
    const merged = mergeChallengeProgressRecords(rows.map((row) => mapChallengeProgressRow(row)));

    if (!merged) {
      inserts.push({
        user_id: user.id,
        challenge_id: challenge.id,
        progress: 0,
        completed: false,
        completed_at: null,
        assigned_at: now.toISOString(),
        expires_at: null,
      });
      continue;
    }

    const [canonicalRow, ...duplicateRows] = rows;
    duplicateRows.forEach((row) => deleteIds.add(row.id));

    const updateData: Partial<DbChallengeProgressRow> = {
      progress: merged.progress,
      completed: merged.completed,
      completed_at: merged.completedAt,
      assigned_at: merged.assignedAt,
      expires_at: null,
    };

    if (
      canonicalRow.progress !== updateData.progress ||
      canonicalRow.completed !== updateData.completed ||
      canonicalRow.completed_at !== updateData.completed_at ||
      canonicalRow.assigned_at !== updateData.assigned_at ||
      canonicalRow.expires_at !== updateData.expires_at
    ) {
      updates.push({ id: canonicalRow.id, data: updateData });
    }
  }

  for (const scheduledChallenge of desiredTimedSchedule) {
    const scheduleKey = scheduledChallengeKey(
      scheduledChallenge.challenge.id,
      scheduledChallenge.assignedAt,
      scheduledChallenge.expiresAt,
    );
    const rows = groupedTimedRows.get(scheduleKey) ?? [];
    const merged = mergeChallengeProgressRecords(rows.map((row) => mapChallengeProgressRow(row)));

    if (!merged) {
      inserts.push({
        user_id: user.id,
        challenge_id: scheduledChallenge.challenge.id,
        progress: 0,
        completed: false,
        completed_at: null,
        assigned_at: scheduledChallenge.assignedAt,
        expires_at: scheduledChallenge.expiresAt,
      });
      continue;
    }

    const [canonicalRow, ...duplicateRows] = rows;
    duplicateRows.forEach((row) => deleteIds.add(row.id));

    const updateData: Partial<DbChallengeProgressRow> = {
      progress: merged.progress,
      completed: merged.completed,
      completed_at: merged.completedAt,
      assigned_at: scheduledChallenge.assignedAt,
      expires_at: scheduledChallenge.expiresAt,
    };

    if (
      canonicalRow.progress !== updateData.progress ||
      canonicalRow.completed !== updateData.completed ||
      canonicalRow.completed_at !== updateData.completed_at ||
      canonicalRow.assigned_at !== updateData.assigned_at ||
      canonicalRow.expires_at !== updateData.expires_at
    ) {
      updates.push({ id: canonicalRow.id, data: updateData });
    }
  }

  for (const chunk of chunkArray(Array.from(deleteIds), 200)) {
    const { error } = await supabase.from("user_challenge_progress").delete().in("id", chunk);
    if (error) {
      throw error;
    }
  }

  for (const updateChunk of chunkArray(updates, 25)) {
    await Promise.all(
      updateChunk.map(async (update) => {
        const { error } = await supabase
          .from("user_challenge_progress")
          .update(update.data)
          .eq("id", update.id);

        if (error) {
          throw error;
        }
      }),
    );
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
  currentLevel: number,
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
    return collections.filter((entry) => {
      const className =
        entry.id === collection.id
          ? card.className
          : cardLookup.get(entry.speciesCardId)?.className;
      return className === target;
    }).length;
  }

  if (conditionType.startsWith("capture_species:")) {
    const target = normalizeSpeciesName(conditionType.split(":")[1]);
    return collections.filter((entry) => {
      const scientificName =
        entry.id === collection.id
          ? card.scientificName
          : cardLookup.get(entry.speciesCardId)?.scientificName;
      return normalizeSpeciesName(scientificName) === target;
    }).length;
  }

  if (conditionType.startsWith("capture_rarity_min:")) {
    const target = conditionType.split(":")[1] as Rarity;
    return collections.filter(
      (entry) => rarityIndex(entry.rarity) >= rarityIndex(target),
    ).length;
  }

  if (conditionType.startsWith("capture_rarity_exact:")) {
    const target = conditionType.split(":")[1] as Rarity;
    return collections.filter((entry) => entry.rarity === target).length;
  }

  if (conditionType === "collect_all_rarities") {
    const rarities = new Set(collections.map((entry) => entry.rarity));
    rarities.add(collection.rarity);
    return rarities.size;
  }

  if (conditionType.startsWith("reach_level:")) {
    const target = Number(conditionType.split(":")[1]);

    if (Number.isNaN(target)) {
      return 0;
    }

    return Math.min(currentLevel, challenge.targetCount);
  }

  return 0;
}

async function applyChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
  collection: UserCollectionRecord,
  card: SpeciesCardRecord,
) {
  const progressRows = await listAllUserChallengeProgressRowsWithChallenges(supabase, userId);

  const { data: userXpRow, error: userXpError } = await supabase
    .from("users")
    .select("total_xp")
    .eq("id", userId)
    .single();

  if (userXpError) {
    throw userXpError;
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
    ((cardRows ?? []) as DbSpeciesCardRow[])
      .map(
        (row): [string, SpeciesCardRecord] => [row.id, mapSpeciesCardRow(row)],
      )
      .filter(([, mappedCard]) => isCatchableKingdom(mappedCard.kingdom)),
  );

  const existingCollections = collectionRowList
    .map((row) => mapUserCollectionRow(row))
    .filter((entry) => cardLookup.has(entry.speciesCardId));

  const progressEntries = dedupeChallengeProgressEntries(
    progressRows
      .map((row) => {
        const challenge = row.challenge;
        if (!challenge || (challenge.type === "achievement" && !currentChallengeIds.has(challenge.id))) {
          return null;
        }

        return {
          progress: mapChallengeProgressRow(row),
          challenge: mapChallengeRow(challenge),
        };
      })
      .filter((entry): entry is ChallengeProgressEntry => Boolean(entry)),
  ).sort((left, right) => {
    const leftPriority =
      left.challenge.type === "achievement"
        ? left.challenge.conditionType.startsWith("reach_level:")
          ? 2
          : 1
        : 0;
    const rightPriority =
      right.challenge.type === "achievement"
        ? right.challenge.conditionType.startsWith("reach_level:")
          ? 2
          : 1
        : 0;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.challenge.targetCount - right.challenge.targetCount;
  });
  let completedChallenge = false;
  let currentTotalXp = userXpRow.total_xp ?? 0;
  let currentLevel = currentLevelFromXp(currentTotalXp);
  const capturedAt = new Date(collection.capturedAt);

  for (const { progress, challenge } of progressEntries) {
    if (progress.completed) {
      continue;
    }

    if (!isChallengeActiveNow(progress, capturedAt)) {
      continue;
    }

    const relevantCollections =
      challenge.type === "achievement"
        ? existingCollections
        : existingCollections.filter(
            (entry) =>
              new Date(entry.capturedAt).getTime() >=
              new Date(progress.assignedAt).getTime(),
          );

    const computedProgress = progressMatchesChallenge(
      challenge.conditionType,
      collection,
      card,
      relevantCollections,
      challenge,
      cardLookup,
      currentLevel,
    );

    let nextProgress = progress.progress;
    if (computedProgress > 0) {
      nextProgress = Math.max(progress.progress, computedProgress);
    }

    const completed = nextProgress >= challenge.targetCount;

    if (nextProgress !== progress.progress || completed !== progress.completed) {
      await supabase
        .from("user_challenge_progress")
        .update({
          progress: nextProgress,
          completed,
          completed_at: completed ? collection.capturedAt : progress.completedAt,
        })
        .eq("id", progress.id);

      if (completed && !progress.completed) {
        completedChallenge = true;
        await awardXp(
          supabase,
          userId,
          challenge.xpReward,
          challenge.type === "achievement" ? "achievement" : "challenge",
          challenge.title,
          collection.capturedAt,
        );
        currentTotalXp += challenge.xpReward;
        currentLevel = currentLevelFromXp(currentTotalXp);
      }
    }
  }

  if (completedChallenge) {
    const userRow = await getUserRowById(supabase, userId);

    if (userRow) {
      await ensureChallenges(supabase, mapUserRow(userRow));
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

export async function ensureUserSetup(
  authUser: SupabaseUser,
  options?: { ensureChallenges?: boolean },
) {
  const supabase = createSupabaseAdminClient();
  const shouldEnsureChallenges = options?.ensureChallenges ?? true;
  const existing = await getUserRowById(supabase, authUser.id);

  if (existing) {
    const user = mapUserRow(existing);
    if (shouldEnsureChallenges) {
      await ensureChallenges(supabase, user);
    }
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
      if (shouldEnsureChallenges) {
        await ensureChallenges(supabase, user);
      }
      return user;
    }
    throw error;
  }

  const user = mapUserRow(inserted as DbUserRow);
  if (shouldEnsureChallenges) {
    await ensureChallenges(supabase, user);
  }
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
  await ensureChallenges(supabase, user);
  const collections = await getUserCollectionsWithCards(supabase, userId);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);

  const progressRows = await listAllUserChallengeProgressRowsWithChallenges(supabase, userId);

  const progressItems = dedupeChallengeProgressEntries(
    progressRows
      .map((row) => {
        const challenge = row.challenge;
        if (!challenge || (challenge.type === "achievement" && !currentChallengeIds.has(challenge.id)) || row.completed) {
          return null;
        }

        return {
          progress: mapChallengeProgressRow(row),
          challenge: mapChallengeRow(challenge),
        };
      })
      .filter((entry): entry is ChallengeProgressEntry => Boolean(entry)),
  ).filter((entry) => isChallengeActiveNow(entry.progress, now));

  const activeDailies = progressItems
    .filter((entry) => entry.challenge.type === "daily")
    .sort((left, right) => {
      if (!left.progress.expiresAt) return 1;
      if (!right.progress.expiresAt) return -1;
      return new Date(left.progress.expiresAt).getTime() - new Date(right.progress.expiresAt).getTime();
    });

  const activeWeeklies = progressItems
    .filter((entry) => entry.challenge.type === "weekly")
    .sort((left, right) => {
      if (!left.progress.expiresAt) return 1;
      if (!right.progress.expiresAt) return -1;
      return new Date(left.progress.expiresAt).getTime() - new Date(right.progress.expiresAt).getTime();
    });

  const selectedChallenges = [
    ...activeDailies.slice(0, 3),
    ...activeWeeklies.slice(0, Math.max(0, 3 - activeDailies.length)),
  ].slice(0, 3);

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
    activeChallenges: selectedChallenges.map((item) => ({
      id: item.challenge.id,
      title: item.challenge.title,
      xpReward: item.challenge.xpReward,
    })),
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
  await ensureChallenges(supabase, { id: userId });
  const now = new Date();
  const progressRows = await listAllUserChallengeProgressRowsWithChallenges(supabase, userId);

  const progressItems = dedupeChallengeProgressEntries(
    progressRows
      .map((row) => {
        const challenge = row.challenge;
        if (!challenge || (challenge.type === "achievement" && !currentChallengeIds.has(challenge.id))) {
          return null;
        }

        return {
          progress: mapChallengeProgressRow(row),
          challenge: mapChallengeRow(challenge),
        };
      })
      .filter((entry): entry is ChallengeProgressEntry => Boolean(entry)),
  );

  const sortChallenges = (
    left: { progress: UserChallengeProgressRecord; challenge: ChallengeTemplateRecord },
    right: { progress: UserChallengeProgressRecord; challenge: ChallengeTemplateRecord },
  ) => {
    if (left.progress.completed !== right.progress.completed) {
      return left.progress.completed ? 1 : -1;
    }
    return (
      new Date(right.progress.assignedAt).getTime() -
      new Date(left.progress.assignedAt).getTime()
    );
  };

  return {
    daily: progressItems
      .filter(
        (entry) =>
          entry.challenge.type === "daily" && isChallengeActiveNow(entry.progress, now),
      )
      .sort(sortChallenges),
    weekly: progressItems
      .filter(
        (entry) =>
          entry.challenge.type === "weekly" && isChallengeActiveNow(entry.progress, now),
      )
      .sort(sortChallenges),
    achievements: progressItems
      .filter((entry) => entry.challenge.type === "achievement")
      .sort(sortChallenges),
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
    .select("user_id, rarity, species_cards(kingdom)");

  if (collectionError) {
    throw collectionError;
  }

  const rarityByUser = new Map<string, Rarity | null>();
  const collectionRowList = (collectionRows ?? []) as Array<{
    user_id: string;
    rarity: Rarity;
    species_cards: Array<Pick<DbSpeciesCardRow, "kingdom">> | Pick<DbSpeciesCardRow, "kingdom"> | null;
  }>;

  for (const row of collectionRowList) {
    const speciesCard = unwrapJoinedRow(row.species_cards);
    if (!isCatchableKingdom(speciesCard?.kingdom)) {
      continue;
    }
    const userRarity = rarityByUser.get(row.user_id) ?? null;
    const next = row.rarity;
    if (!userRarity || rarityIndex(next) > rarityIndex(userRarity)) {
      rarityByUser.set(row.user_id, next);
    }
  }

  const realRows = users.map((user) => ({
    user,
    xp: xpByUser.get(user.id) ?? 0,
    topRarity: rarityByUser.get(user.id) ?? null,
  }));

  const rows = realRows
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
    console.log(`[Capture] ðŸŽ¯ Starting capture pipeline for user: ${userId}`);
    console.log(`[Capture]    Location: lat=${payload.lat}, lng=${payload.lng}`);

    const analysis = await identifyWithGemini(payload.imageData);

    // TODO: Re-enable screen detection in the Gemini prompt before production!
    if (!analysis.valid_capture) {
      console.log(`[Capture] âŒ Invalid capture â€” reason: ${analysis.reason}`);
      return {
        kind: "invalid",
        reason: analysis.reason,
        message: INVALID_CAPTURE_MESSAGE,
      };
    }

    if (!isCatchableKingdom(analysis.kingdom)) {
      console.log(`[Capture] âŒ Non-animal subject rejected: ${analysis.kingdom}`);
      return {
        kind: "invalid",
        reason: "non_animal",
        message: INVALID_CAPTURE_MESSAGE,
      };
    }

    if (analysis.confidence === "low") {
      console.log(`[Capture] âš ï¸ Low confidence â€” aborting`);
      return {
        kind: "low_confidence",
        message: "Couldn't identify this one. Try getting closer or better lighting.",
      };
    }

    const supabase = createSupabaseAdminClient();
    const location = inferLocation(payload.lat, payload.lng);
    console.log(`[Capture] ðŸ“ Inferred location: ${location.label} (${location.countryCode}, ${location.environmentType})`);

    // Step 1: Check if species already exists in our DB
    console.log(`[Capture] ðŸ” Step 1: Checking DB for "${analysis.common_name}" / "${analysis.scientific_name}"...`);
    let species = await findSpeciesByName(
      supabase,
      analysis.common_name,
      analysis.scientific_name,
    );

    // Step 2: If not in DB, resolve dynamically via APIs
    if (!species) {
      console.log(`[Capture] ðŸŒ Step 2: Not in DB â€” resolving via GBIF + iNaturalist + Wikipedia...`);

      const resolved = await resolveSpeciesFromAPIs(
        analysis.common_name,
        analysis.scientific_name,
        location.countryCode,
      );

      if (!resolved) {
        console.log(`[Capture] âŒ API resolution failed â€” no GBIF match`);
        return {
          kind: "low_confidence",
          message: "Couldn't verify this species. Try getting closer or better lighting.",
        };
      }

      console.log(`[Capture] âœ… Resolved: ${resolved.commonName} (${resolved.scientificName})`);
      console.log(`[Capture]    Photo: ${resolved.photoSource} | Lore: ${resolved.lore ? resolved.lore.slice(0, 60) + '...' : '(none)'}`);
      console.log(`[Capture]    Occurrence: ${resolved.occurrenceCount.toLocaleString()}`);

      if (!isCatchableKingdom(resolved.kingdom)) {
        console.log(`[Capture] âŒ Non-animal species rejected after GBIF resolution: ${resolved.kingdom}`);
        return {
          kind: "invalid",
          reason: "non_animal",
          message: INVALID_CAPTURE_MESSAGE,
        };
      }

      // Step 3: Create the species card
      console.log(`[Capture] ðŸ’¾ Step 3: Upserting species card...`);
      species = await ensureSpeciesCard(supabase, resolved);
      console.log(`[Capture] âœ… Species card ready: id=${species.id}`);
    } else {
      console.log(`[Capture] âœ… Found in DB: id=${species.id}, "${species.commonName}"`);
    }

    const capturedImageUrl = await saveCaptureImage(userId, payload.imageData);
    console.log(`[Capture] ðŸ“¸ Image saved: ${capturedImageUrl}`);

    // Step 4: Duplicate check
    console.log(`[Capture] ðŸ” Step 4: Checking for duplicate (taxon key: ${species.gbifTaxonKey})...`);
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
      console.log(`[Capture] âš ï¸ Duplicate! Already in user's collection`);
      const duplicate = mapUserCollectionRow(duplicateRow as DbUserCollectionRow);
      return {
        kind: "duplicate",
        card: cloneCardForCollection(species, duplicate),
        collection: null,
        xpAwarded: 0,
      } satisfies CaptureResult;
    }

    // Step 5: Get live regional occurrence for rarity
    console.log(`[Capture] ðŸ“Š Step 5: Fetching regional rarity...`);
    const regionalOccurrence = await fetchGbifRegionalOccurrence(
      species.gbifTaxonKey,
      location.countryCode,
    );
    const effectiveOccurrence = regionalOccurrence > 0 ? regionalOccurrence : species.occurrenceCount;
    const rarity = getRarityFromOccurrence(effectiveOccurrence, species.scientificName);
    const xpValue = rarityXp[rarity];
    console.log(`[Capture] â­ Rarity: ${rarity.toUpperCase()} (${effectiveOccurrence.toLocaleString()} occurrences) â†’ ${xpValue} XP`);
    const now = new Date().toISOString();

    // Step 6: Create user collection entry
    console.log(`[Capture] ðŸ’¾ Step 6: Creating collection entry...`);
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

    console.log(`[Capture] ðŸŽ‰ SUCCESS! "${species.commonName}" captured as ${rarity.toUpperCase()} for ${xpValue} XP`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      kind: "new",
      card: cloneCardForCollection(species, collection),
      collection,
      xpAwarded: xpValue,
    } satisfies CaptureResult;
  } catch (error) {
    console.error(`[Capture] ðŸ’¥ ERROR:`, error instanceof Error ? error.message : error);
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

