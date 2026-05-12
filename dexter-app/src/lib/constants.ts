import type { Rarity, TabSlug } from "@/lib/types";

export const tabTheme = {
  home: "#2191FB",
  dexe: "#FE5F55",
  challenges: "#1FC147",
  leaderboard: "#E1BC29",
  profile: "#7902BD",
} satisfies Record<TabSlug, string>;

export const rarityColors = {
  common: "#9EA3A8",
  uncommon: "#4FB26E",
  rare: "#0F52BA",
  epic: "#E40046",
  legendary: "#6536A7",
} satisfies Record<Rarity, string>;

export const rarityOrder: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const rarityXp = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
} satisfies Record<Rarity, number>;

export const tabs = [
  { slug: "profile", label: "Profile" },
  { slug: "challenges", label: "Challenges" },
  { slug: "leaderboard", label: "Leaderboard" },
  { slug: "dexe", label: "DexE" },
  { slug: "home", label: "Home" },
] as const;
