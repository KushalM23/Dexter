import type { Rarity, EnvironmentType } from "@/lib/types";

export type ChallengeTemplateCategory = 
  | "any"
  | "class"
  | "distinct_class"
  | "rarity_min"
  | "rarity_exact"
  | "collect_all"
  | "kingdom"
  | "distinct_kingdom";

export interface TargetRule {
  early: number; // Level 1-3
  mid: number;   // Level 4-6
  late: number;  // Level 7+
}

export interface RewardRule {
  early: number;
  mid: number;
  late: number;
}

export interface ChallengeTemplate {
  id: string;
  titleTemplate: string;
  descriptionTemplate: string;
  type: "daily" | "weekly";
  category: ChallengeTemplateCategory;
  environmentScope: "urban" | "rural" | "any";
  generationWeight: number;
  cooldownDays: number;
  enabled: boolean;
  targetRules: TargetRule;
  rewardRules: RewardRule;
  allowedClasses?: string[];
  allowedRarities?: Rarity[];
  allowedKingdoms?: string[];
}

export const CLASS_LABELS: Record<string, string> = {
  Aves: "bird",
  Mammalia: "mammal",
  Insecta: "insect",
  Amphibia: "amphibian",
  Reptilia: "reptile",
  Actinopterygii: "fish",
  Arachnida: "arachnid",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const KINGDOM_LABELS: Record<string, string> = {
  Plantae: "plant",
  Fungi: "fungi",
  Animalia: "animal",
};

export const challengeTemplates: ChallengeTemplate[] = [
  // ── Daily Templates ──
  {
    id: "daily_any_capture",
    titleTemplate: "Daily Survey",
    descriptionTemplate: "Capture {target} species of any kind today.",
    type: "daily",
    category: "any",
    environmentScope: "any",
    generationWeight: 10,
    cooldownDays: 1,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 4 },
    rewardRules: { early: 15, mid: 30, late: 60 },
  },
  {
    id: "daily_class_hunter",
    titleTemplate: "{classLabel} Spotting",
    descriptionTemplate: "Spot {target} {classLabel} species today.",
    type: "daily",
    category: "class",
    environmentScope: "any",
    generationWeight: 8,
    cooldownDays: 2,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 3 },
    rewardRules: { early: 25, mid: 45, late: 68 },
    allowedClasses: ["Aves", "Mammalia", "Insecta"],
  },
  {
    id: "daily_wild_class_hunter",
    titleTemplate: "Wild {classLabel} Search",
    descriptionTemplate: "Find {target} wild {classLabel} today.",
    type: "daily",
    category: "class",
    environmentScope: "rural",
    generationWeight: 8,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 3 },
    rewardRules: { early: 28, mid: 50, late: 75 },
    allowedClasses: ["Reptilia", "Amphibia", "Actinopterygii"],
  },
  {
    id: "daily_arachnid_hunter",
    titleTemplate: "Spider Sense",
    descriptionTemplate: "Find an arachnid species today.",
    type: "daily",
    category: "class",
    environmentScope: "any",
    generationWeight: 6,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 1, mid: 1, late: 2 },
    rewardRules: { early: 25, mid: 25, late: 40 },
    allowedClasses: ["Arachnida"],
  },
  {
    id: "daily_distinct_classes",
    titleTemplate: "Class Hopper",
    descriptionTemplate: "Capture {target} different animal classes today.",
    type: "daily",
    category: "distinct_class",
    environmentScope: "any",
    generationWeight: 6,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 2, mid: 2, late: 3 },
    rewardRules: { early: 45, mid: 45, late: 65 },
  },
  {
    id: "daily_rarity_min",
    titleTemplate: "{rarityLabel} Discovery",
    descriptionTemplate: "Capture {target} {rarityLabel} or better species today.",
    type: "daily",
    category: "rarity_min",
    environmentScope: "any",
    generationWeight: 7,
    cooldownDays: 2,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 3 },
    rewardRules: { early: 35, mid: 55, late: 75 },
    allowedRarities: ["uncommon", "rare"],
  },
  {
    id: "daily_rarity_exact",
    titleTemplate: "{rarityLabel} Census",
    descriptionTemplate: "Capture exactly {target} {rarityLabel} species today.",
    type: "daily",
    category: "rarity_exact",
    environmentScope: "any",
    generationWeight: 5,
    cooldownDays: 4,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 3 },
    rewardRules: { early: 30, mid: 45, late: 60 },
    allowedRarities: ["common", "uncommon"],
  },
  {
    id: "daily_kingdom_hunter",
    titleTemplate: "{kingdomLabel} Spotter",
    descriptionTemplate: "Find a {kingdomLabel} species today.",
    type: "daily",
    category: "kingdom",
    environmentScope: "any",
    generationWeight: 6,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 1, mid: 1, late: 2 },
    rewardRules: { early: 15, mid: 25, late: 40 },
    allowedKingdoms: ["Plantae", "Fungi"],
  },

  // ── Weekly Templates ──
  {
    id: "weekly_any_capture",
    titleTemplate: "Weekly Explorer",
    descriptionTemplate: "Capture {target} species this week.",
    type: "weekly",
    category: "any",
    environmentScope: "any",
    generationWeight: 10,
    cooldownDays: 1,
    enabled: true,
    targetRules: { early: 5, mid: 10, late: 15 },
    rewardRules: { early: 70, mid: 130, late: 190 },
  },
  {
    id: "weekly_class_collector",
    titleTemplate: "Weekly {classLabel} Collector",
    descriptionTemplate: "Capture {target} different {classLabel} species this week.",
    type: "weekly",
    category: "class",
    environmentScope: "any",
    generationWeight: 8,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 2, mid: 3, late: 5 },
    rewardRules: { early: 80, mid: 120, late: 170 },
    allowedClasses: ["Aves", "Mammalia", "Insecta"],
  },
  {
    id: "weekly_distinct_classes",
    titleTemplate: "Biodiversity Scout",
    descriptionTemplate: "Capture {target} different animal classes this week.",
    type: "weekly",
    category: "distinct_class",
    environmentScope: "any",
    generationWeight: 6,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 3, mid: 4, late: 5 },
    rewardRules: { early: 100, mid: 160, late: 220 },
  },
  {
    id: "weekly_rarity_min",
    titleTemplate: "{rarityLabel} Expedition",
    descriptionTemplate: "Capture {target} {rarityLabel} or better species this week.",
    type: "weekly",
    category: "rarity_min",
    environmentScope: "any",
    generationWeight: 7,
    cooldownDays: 2,
    enabled: true,
    targetRules: { early: 1, mid: 2, late: 3 },
    rewardRules: { early: 100, mid: 150, late: 220 },
    allowedRarities: ["rare", "epic"],
  },
  {
    id: "weekly_rarity_exact",
    titleTemplate: "{rarityLabel} Stack",
    descriptionTemplate: "Capture exactly {target} {rarityLabel} species this week.",
    type: "weekly",
    category: "rarity_exact",
    environmentScope: "any",
    generationWeight: 5,
    cooldownDays: 4,
    enabled: true,
    targetRules: { early: 3, mid: 4, late: 6 },
    rewardRules: { early: 120, mid: 180, late: 240 },
    allowedRarities: ["common", "uncommon"],
  },
  {
    id: "weekly_rarity_sweep",
    titleTemplate: "Rarity Sweep",
    descriptionTemplate: "Collect at least one card of every rarity this week.",
    type: "weekly",
    category: "collect_all",
    environmentScope: "any",
    generationWeight: 3,
    cooldownDays: 7,
    enabled: true,
    targetRules: { early: 5, mid: 5, late: 5 },
    rewardRules: { early: 250, mid: 250, late: 250 },
  },
  {
    id: "weekly_kingdom_collector",
    titleTemplate: "Green Thumb Week",
    descriptionTemplate: "Find {target} {kingdomLabel} species this week.",
    type: "weekly",
    category: "kingdom",
    environmentScope: "any",
    generationWeight: 6,
    cooldownDays: 3,
    enabled: true,
    targetRules: { early: 2, mid: 3, late: 5 },
    rewardRules: { early: 50, mid: 80, late: 120 },
    allowedKingdoms: ["Plantae", "Fungi"],
  },
  {
    id: "weekly_kingdom_diversity",
    titleTemplate: "Cross-Kingdom Explorer",
    descriptionTemplate: "Capture species from {target} different kingdoms this week.",
    type: "weekly",
    category: "distinct_kingdom",
    environmentScope: "any",
    generationWeight: 5,
    cooldownDays: 4,
    enabled: true,
    targetRules: { early: 2, mid: 2, late: 3 },
    rewardRules: { early: 80, mid: 80, late: 150 },
  },
];
