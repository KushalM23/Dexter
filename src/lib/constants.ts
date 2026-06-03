import type { Rarity, TabSlug } from "@/lib/types";

export const tabThemeConfig = {
  home: {
    accent: "#2191FB",
    soft: "#D8ECFF",
    wash: "#F5FAFF",
    ink: "#12385F",
    contrast: "#FFFFFF",
    chrome: "#97C9FF",
    shadow: "rgba(33,145,251,0.22)",
  },
  dexe: {
    accent: "#FE5F55",
    soft: "#FFD7D3",
    wash: "#FFF8F6",
    ink: "#5B241F",
    contrast: "#FFFFFF",
    chrome: "#FFB1AB",
    shadow: "rgba(254,95,85,0.22)",
  },
  challenges: {
    accent: "#1FC147",
    soft: "#D6F7DE",
    wash: "#F7FFF8",
    ink: "#134926",
    contrast: "#FFFFFF",
    chrome: "#92E7A6",
    shadow: "rgba(31,193,71,0.2)",
  },
  leaderboard: {
    accent: "#E1BC29",
    soft: "#FFF1AF",
    wash: "#FFFDF4",
    ink: "#5C4808",
    contrast: "#1A1A1A",
    chrome: "#F7D96B",
    shadow: "rgba(225,188,41,0.2)",
  },
  profile: {
    accent: "#7902BD",
    soft: "#EAD2FF",
    wash: "#FBF6FF",
    ink: "#381452",
    contrast: "#FFFFFF",
    chrome: "#C488FF",
    shadow: "rgba(121,2,189,0.22)",
  },
} satisfies Record<
  TabSlug,
  {
    accent: string;
    soft: string;
    wash: string;
    ink: string;
    contrast: string;
    chrome: string;
    shadow: string;
  }
>;

export const tabTheme = Object.fromEntries(
  Object.entries(tabThemeConfig).map(([key, value]) => [key, value.accent]),
) as Record<TabSlug, string>;

export const rarityColors = {
  common: "#9EA3A8",
  uncommon: "#4FB26E",
  rare: "#0F52BA",
  epic: "#E40046",
  legendary: "#6536A7",
} satisfies Record<Rarity, string>;

export const rarityCardThemes = {
  common: {
    light: "#D4D8DD",
    base: "#9EA3A8",
    dark: "#5B6370",
    accent: "#E5E9ED",
  },
  uncommon: {
    light: "#9FE7B5",
    base: "#4FB26E",
    dark: "#1F6840",
    accent: "#CFF6DC",
  },
  rare: {
    light: "#77B5FF",
    base: "#0F52BA",
    dark: "#0A2F69",
    accent: "#CBE2FF",
  },
  epic: {
    light: "#FF7AA3",
    base: "#E40046",
    dark: "#7A072C",
    accent: "#FFD0E1",
  },
  legendary: {
    light: "#B58DFF",
    base: "#6536A7",
    dark: "#2F175A",
    accent: "#E3D2FF",
  },
} satisfies Record<
  Rarity,
  {
    light: string;
    base: string;
    dark: string;
    accent: string;
  }
>;

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
