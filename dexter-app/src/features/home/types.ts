import type { PhotoSource, Rarity } from "@/lib/types";

export type HomeData = {
  user: {
    displayName: string;
    environmentType?: string;
    totalXp?: number;
  };
  todayLabel: string;
  totalCards: number;
  stats: {
    weeklyXp: number;
    capturesToday: number;
    streak: number;
  };
  recentCaptures: Array<{
    collection: {
      rarity: Rarity;
      xpAwarded: number;
      captureLocationLabel: string;
      capturedAt: string;
    };
    card: {
      commonName: string;
      scientificName: string;
      kingdom: string;
      phylum: string;
      className: string;
      order: string;
      family: string;
      genus: string;
      species: string;
      rarity: Rarity;
      xpValue: number;
      photoUrl: string;
      pixelArtUrl: string;
      photoSource: PhotoSource;
      lore: string;
      occurrenceCount: number;
    };
  }>;
  activeChallenge: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    progress: number;
    targetCount: number;
    expiresLabel: string;
  } | null;
};

export type HomeScreenMode =
  | "idle"
  | "camera"
  | "preview"
  | "processing"
  | "result";
