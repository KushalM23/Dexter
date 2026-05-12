"use client";

import { useMemo, useState } from "react";

import { SpeciesCard } from "@/components/species-card";
import { rarityColors } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

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

export function CollectionScreen({ items }: { items: CollectionItem[] }) {
  const [filter, setFilter] = useState<"all" | Rarity>("all");

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        filter === "all" ? true : item.collection.rarity === filter,
      ),
    [filter, items],
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const active = item === filter;
          const tint = item === "all" ? "#3B82F6" : rarityColors[item];

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className="rounded-full border-[3px] px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                borderColor: tint,
                backgroundColor: active ? tint : "#FAFAFF",
                color: active ? "#FAFAFF" : "#1A1A1A",
              }}
            >
              {item === "all" ? "All" : item}
            </button>
          );
        })}
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
              lore={item.card.lore}
              occurrenceCount={item.card.occurrenceCount}
              locationLabel={item.collection.captureLocationLabel}
              capturedAt={item.collection.capturedAt}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[30px] border-[3px] border-dashed border-black/16 bg-white px-5 py-10 text-center">
          <div className="font-[family:var(--font-display)] text-4xl leading-none">
            No {filter === "all" ? "" : filter} catches yet.
          </div>
          <p className="mt-4 text-sm leading-6 text-black/65">
            Get out there and find something wild.
          </p>
        </div>
      )}
    </div>
  );
}
