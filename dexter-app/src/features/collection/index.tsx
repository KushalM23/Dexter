"use client";

import { useMemo, useState } from "react";

import { SpeciesCard } from "@/components/cards/species-card";
import {
  PosterEmptyState,
  SectionDivider,
} from "@/components/ui/screen-primitives";
import { rarityColors, tabThemeConfig } from "@/lib/constants";
import type { PhotoSource, Rarity } from "@/lib/types";

type CollectionItem = {
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
};

const filters: Array<"all" | Rarity> = [
  "all",
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

const COLLECTION_THEME = tabThemeConfig.dexe;

export function CollectionScreen({ items }: { items: CollectionItem[] }) {
  const [filter, setFilter] = useState<"all" | Rarity>("all");

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        filter === "all" ? true : item.collection.rarity === filter,
      ),
    [filter, items],
  );

  const filterLabel = filter === "all" ? "All Catches" : capitalize(filter);

  return (
    <div className="space-y-6 pb-8">
      <div className="panel-card space-y-4 px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="display-title-sm" style={{ color: COLLECTION_THEME.ink }}>
            {filterLabel}
          </div>
          <div className="eyebrow-badge" style={{ backgroundColor: COLLECTION_THEME.soft, color: COLLECTION_THEME.ink }}>
            {visibleItems.length}
          </div>
        </div>

        <SectionDivider />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active = item === filter;
            const accent = item === "all" ? COLLECTION_THEME.accent : rarityColors[item];

            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className="rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-transform active:scale-[0.98]"
                style={{
                  backgroundColor: active ? accent : "var(--surface)",
                  borderColor: active ? "var(--border-strong)" : "rgba(26,26,26,0.16)",
                  color: active ? "var(--surface)" : "var(--foreground)",
                  boxShadow: active ? `4px 4px 0 ${accent}55` : "none",
                }}
              >
                {item === "all" ? "All" : item}
              </button>
            );
          })}
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {visibleItems.map((item) => (
            <SpeciesCard
              key={`${item.card.commonName}-${item.collection.capturedAt}`}
              compact
              commonName={item.card.commonName}
              scientificName={item.card.scientificName}
              kingdom={item.card.kingdom}
              phylum={item.card.phylum}
              className={item.card.className}
              order={item.card.order}
              family={item.card.family}
              genus={item.card.genus}
              species={item.card.species}
              rarity={item.collection.rarity}
              xpValue={item.collection.xpAwarded}
              photoUrl={item.card.photoUrl}
              pixelArtUrl={item.card.pixelArtUrl}
              photoSource={item.card.photoSource}
              lore={item.card.lore}
              occurrenceCount={item.card.occurrenceCount}
              locationLabel={item.collection.captureLocationLabel}
              capturedAt={item.collection.capturedAt}
            />
          ))}
        </div>
      ) : (
        <PosterEmptyState
          title={`No ${filter === "all" ? "catches" : filter} catches yet`}
          body="Get out there, log a fresh sighting, and this shelf will start filling up fast."
          accent={COLLECTION_THEME.accent}
          soft={COLLECTION_THEME.soft}
        />
      )}
    </div>
  );
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
