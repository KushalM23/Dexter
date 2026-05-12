export type EnvironmentType = "urban" | "rural";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ChallengeType = "daily" | "weekly" | "achievement";

export type PhotoSource = "inaturalist" | "gbif" | "wikipedia" | "silhouette";

export type TabSlug =
  | "home"
  | "dexe"
  | "challenges"
  | "leaderboard"
  | "profile";

export type CaptureRejectReason =
  | "photo_of_screen"
  | "illustration"
  | "no_organism"
  | "toy_or_statue";

export type Confidence = "high" | "medium" | "low";

export interface UserRecord {
  id: string;
  email: string;
  googleName: string;
  displayName: string;
  avatarId: string;
  friendCode: string;
  totalXp: number;
  environmentType: EnvironmentType;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface SpeciesCardRecord {
  id: string;
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
  rarity: Rarity;
  xpValue: number;
  photoUrl: string;
  photoSource: PhotoSource;
  lore: string;
  occurrenceCount: number;
  createdAt: string;
}

export interface UserCollectionRecord {
  id: string;
  userId: string;
  speciesCardId: string;
  gbifTaxonKey: number;
  rarity: Rarity;
  xpAwarded: number;
  capturedImageUrl: string;
  capturedAt: string;
  captureLat: number;
  captureLng: number;
  captureLocationLabel: string;
  countryCode: string;
}

export interface ChallengeTemplateRecord {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  environmentType: EnvironmentType | "any";
  xpReward: number;
  targetCount: number;
  conditionType: string;
}

export interface UserChallengeProgressRecord {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  assignedAt: string;
  expiresAt: string | null;
}

export interface CaptureSuccessPayload {
  kind: "new" | "duplicate";
  card: SpeciesCardRecord;
  collection: UserCollectionRecord | null;
  xpAwarded: number;
}

export interface CaptureFailurePayload {
  kind: "low_confidence" | "invalid" | "error";
  reason?: CaptureRejectReason;
  message: string;
}

export type CaptureResult = CaptureSuccessPayload | CaptureFailurePayload;
