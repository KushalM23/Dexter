import { createHash } from "node:crypto";

import type { ChallengeTemplateRecord, Rarity } from "@/lib/types";

type ChallengeDraft = Omit<ChallengeTemplateRecord, "id" | "environmentType"> & {
  slug: string;
};

function challengeId(slug: string) {
  const hash = createHash("sha1").update(slug).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function createChallenge(draft: ChallengeDraft): ChallengeTemplateRecord {
  return {
    id: challengeId(draft.slug),
    title: draft.title,
    description: draft.description,
    type: draft.type,
    environmentType: "any",
    xpReward: draft.xpReward,
    targetCount: draft.targetCount,
    conditionType: draft.conditionType,
  };
}

function classChallenge(
  slug: string,
  title: string,
  description: string,
  type: "daily" | "weekly" | "achievement",
  className: string,
  targetCount: number,
  xpReward: number,
) {
  return createChallenge({
    slug,
    title,
    description,
    type,
    targetCount,
    xpReward,
    conditionType: `capture_class:${className}`,
  });
}

function rarityChallenge(
  slug: string,
  title: string,
  description: string,
  type: "daily" | "weekly" | "achievement",
  rarity: Rarity,
  targetCount: number,
  xpReward: number,
  exact = false,
) {
  return createChallenge({
    slug,
    title,
    description,
    type,
    targetCount,
    xpReward,
    conditionType: `${exact ? "capture_rarity_exact" : "capture_rarity_min"}:${rarity}`,
  });
}

function levelChallenge(
  slug: string,
  title: string,
  description: string,
  level: number,
  xpReward: number,
) {
  return createChallenge({
    slug,
    title,
    description,
    type: "achievement",
    targetCount: level,
    xpReward,
    conditionType: `reach_level:${level}`,
  });
}

const dailyChallenges: ChallengeTemplateRecord[] = [
  createChallenge({
    slug: "daily-field-note",
    title: "Field Note",
    description: "Capture any animal today.",
    type: "daily",
    targetCount: 1,
    xpReward: 15,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "daily-double-sighting",
    title: "Double Sighting",
    description: "Capture 2 animals today.",
    type: "daily",
    targetCount: 2,
    xpReward: 30,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "daily-triple-trek",
    title: "Triple Trek",
    description: "Capture 3 animals today.",
    type: "daily",
    targetCount: 3,
    xpReward: 45,
    conditionType: "capture_any",
  }),
  classChallenge(
    "daily-bird-watch",
    "Bird Watch",
    "Find a bird species today.",
    "daily",
    "Aves",
    1,
    25,
  ),
  rarityChallenge(
    "daily-shiny-find",
    "Shiny Find",
    "Capture an Uncommon or better species today.",
    "daily",
    "uncommon",
    1,
    35,
  ),
];

const weeklyChallenges: ChallengeTemplateRecord[] = [
  createChallenge({
    slug: "weekly-five-finds",
    title: "Five Finds",
    description: "Capture 5 animals this week.",
    type: "weekly",
    targetCount: 5,
    xpReward: 70,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "weekly-ten-tally",
    title: "Ten Tally",
    description: "Capture 10 animals this week.",
    type: "weekly",
    targetCount: 10,
    xpReward: 130,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "weekly-class-collector",
    title: "Class Collector",
    description: "Capture 3 different animal classes this week.",
    type: "weekly",
    targetCount: 3,
    xpReward: 100,
    conditionType: "capture_distinct_class",
  }),
  rarityChallenge(
    "weekly-rare-encounter",
    "Rare Encounter",
    "Find a Rare or better species this week.",
    "weekly",
    "rare",
    1,
    140,
  ),
  classChallenge(
    "weekly-bird-binge",
    "Bird Binge",
    "Capture 3 bird species this week.",
    "weekly",
    "Aves",
    3,
    120,
  ),
];

const achievements: ChallengeTemplateRecord[] = [
  createChallenge({
    slug: "achievement-first-catch",
    title: "First Catch",
    description: "Capture your first species.",
    type: "achievement",
    targetCount: 1,
    xpReward: 50,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "achievement-pocket-collection",
    title: "Pocket Collection",
    description: "Capture 5 species.",
    type: "achievement",
    targetCount: 5,
    xpReward: 80,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "achievement-species-shelf",
    title: "Species Shelf",
    description: "Capture 10 species.",
    type: "achievement",
    targetCount: 10,
    xpReward: 120,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "achievement-field-archivist",
    title: "Field Archivist",
    description: "Capture 25 species.",
    type: "achievement",
    targetCount: 25,
    xpReward: 220,
    conditionType: "capture_any",
  }),
  createChallenge({
    slug: "achievement-wildlife-ledger",
    title: "Wildlife Ledger",
    description: "Capture 50 species.",
    type: "achievement",
    targetCount: 50,
    xpReward: 350,
    conditionType: "capture_any",
  }),
  classChallenge(
    "achievement-sky-scout",
    "Sky Scout",
    "Capture your first bird species.",
    "achievement",
    "Aves",
    1,
    60,
  ),
  classChallenge(
    "achievement-mammal-scout",
    "Mammal Scout",
    "Capture your first mammal.",
    "achievement",
    "Mammalia",
    1,
    60,
  ),
  classChallenge(
    "achievement-bug-scout",
    "Bug Scout",
    "Capture your first insect.",
    "achievement",
    "Insecta",
    1,
    55,
  ),
  classChallenge(
    "achievement-frog-finder",
    "Frog Finder",
    "Capture your first amphibian.",
    "achievement",
    "Amphibia",
    1,
    65,
  ),
  classChallenge(
    "achievement-scale-spotter",
    "Scale Spotter",
    "Capture your first reptile.",
    "achievement",
    "Reptilia",
    1,
    65,
  ),
  classChallenge(
    "achievement-bird-atlas",
    "Bird Atlas",
    "Capture 5 bird species.",
    "achievement",
    "Aves",
    5,
    140,
  ),
  classChallenge(
    "achievement-mammal-atlas",
    "Mammal Atlas",
    "Capture 5 mammals.",
    "achievement",
    "Mammalia",
    5,
    150,
  ),
  classChallenge(
    "achievement-insect-index",
    "Insect Index",
    "Capture 5 insects.",
    "achievement",
    "Insecta",
    5,
    130,
  ),
  rarityChallenge(
    "achievement-bright-start",
    "Bright Start",
    "Capture your first Uncommon or better species.",
    "achievement",
    "uncommon",
    1,
    70,
  ),
  rarityChallenge(
    "achievement-rare-radar",
    "Rare Radar",
    "Capture your first Rare or better species.",
    "achievement",
    "rare",
    1,
    130,
  ),
  rarityChallenge(
    "achievement-epic-hunter",
    "Epic Hunter",
    "Capture your first Epic or better species.",
    "achievement",
    "epic",
    1,
    240,
  ),
  rarityChallenge(
    "achievement-legendary-hunter",
    "Legendary Hunter",
    "Capture your first Legendary species.",
    "achievement",
    "legendary",
    1,
    500,
    true,
  ),
  createChallenge({
    slug: "achievement-class-sampler",
    title: "Class Sampler",
    description: "Capture 3 different animal classes.",
    type: "achievement",
    targetCount: 3,
    xpReward: 140,
    conditionType: "capture_distinct_class",
  }),
  createChallenge({
    slug: "achievement-biodiversity-board",
    title: "Biodiversity Board",
    description: "Capture 5 different animal classes.",
    type: "achievement",
    targetCount: 5,
    xpReward: 280,
    conditionType: "capture_distinct_class",
  }),
  createChallenge({
    slug: "achievement-full-house",
    title: "Full House",
    description: "Collect at least one card of every rarity.",
    type: "achievement",
    targetCount: 5,
    xpReward: 300,
    conditionType: "collect_all_rarities",
  }),
  levelChallenge(
    "achievement-rookie-naturalist",
    "Rookie Naturalist",
    "Reach level 2.",
    2,
    60,
  ),
  levelChallenge(
    "achievement-field-adept",
    "Field Adept",
    "Reach level 3.",
    3,
    90,
  ),
  levelChallenge(
    "achievement-trail-scholar",
    "Trail Scholar",
    "Reach level 5.",
    5,
    160,
  ),
  levelChallenge(
    "achievement-habitat-hero",
    "Habitat Hero",
    "Reach level 7.",
    7,
    250,
  ),
  levelChallenge(
    "achievement-master-tracker",
    "Master Tracker",
    "Reach level 10.",
    10,
    400,
  ),
];

export const challengeCatalog = [
  ...dailyChallenges,
  ...weeklyChallenges,
  ...achievements,
];
