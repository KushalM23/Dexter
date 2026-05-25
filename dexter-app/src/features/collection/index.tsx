"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, Check } from "lucide-react";

import { SpeciesCard } from "@/components/cards/species-card";
import { DexterEyes } from "@/components/ui/illustrations";
import {
  DataStrip,
  PosterEmptyState,
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

// Framer Motion Stagger Variants for Premium Dropdown Options
const dropdownVariants = {
  hidden: {
    opacity: 0,
    transition: {
      staggerChildren: 0.015,
      staggerDirection: -1, // Exit from bottom up
    },
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const optionVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 350, damping: 22 }
  },
};

export function CollectionScreen({ items }: { items: CollectionItem[] }) {
  const [filter, setFilter] = useState<"all" | Rarity>("all");
  const [isOpen, setIsOpen] = useState(false);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        filter === "all" ? true : item.collection.rarity === filter,
      ),
    [filter, items],
  );

  const statsItems = useMemo(() => {
    const totalCatches = items.length;
    const uniqueSpeciesCount = new Set(items.map((i) => i.card.commonName)).size;
    const totalXp = items.reduce((sum, item) => sum + item.collection.xpAwarded, 0);

    return [
      { label: "Catches", value: `${totalCatches}` },
      { label: "Unique", value: `${uniqueSpeciesCount}` },
      { label: "XP Gained", value: `${totalXp}` },
    ];
  }, [items]);

  return (
    <div className="space-y-6 pb-10">
      {/* Click Outside Overlay to Close Dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 cursor-default" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Brand-Led Premium Header */}
      <div className="relative pb-2">
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
          className="display-hero flex flex-row items-center gap-3 pl-4 !font-slackey !tracking-tight whitespace-nowrap leading-none"
          style={{ color: COLLECTION_THEME.accent }}
        >
          DexE
          <motion.div
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.9, 0.93, 0.96, 1],
              ease: "easeInOut",
            }}
            className="shrink-0 origin-center"
          >
            <DexterEyes size={64} color={COLLECTION_THEME.accent} />
          </motion.div>
        </motion.div>
      </div>

      {/* Custom Rarity Dropdown Selector Area */}
      <div className="relative z-45 h-[58px] w-full sm:w-80">
        {/* Click Outside Overlay to Close Dropdown */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-30 cursor-default" 
            onClick={() => setIsOpen(false)} 
          />
        )}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="absolute top-0 left-0 w-full rounded-2xl border z-40 overflow-hidden"
          style={{
            backgroundColor: COLLECTION_THEME.accent,
            borderColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: isOpen 
              ? `0 24px 50px -12px var(--theme-shadow), 0 1px 0 rgba(255,255,255,0.2) inset`
              : `0 10px 24px -10px var(--theme-shadow), 0 1px 0 rgba(255,255,255,0.25) inset`,
          }}
        >
          {/* Header Row (Trigger) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between gap-4 w-full px-4.5 py-3 transition-all cursor-pointer select-none outline-none focus:outline-none"
          >
            <div className="flex items-center gap-3">
              {/* Elegant visual badge for active rarity */}
              
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[13px] font-display uppercase tracking-[0.04em] mt-0.5" style={{ color: "#FFFFFF" }}>
                  {filter === "all" ? "All" : filter}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="shrink-0 pr-0.5"
            >
              <ChevronDown className="h-4.5 w-4.5 stroke-[2.5]" style={{ color: "#FFFFFF" }} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: 1, 
                  height: "auto",
                  transition: { 
                    height: { type: "spring", stiffness: 350, damping: 28 },
                    opacity: { duration: 0.2 }
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0,
                  transition: { 
                    height: { type: "spring", stiffness: 350, damping: 28 },
                    opacity: { duration: 0.12 }
                  }
                }}
                className="overflow-hidden border-t border-white/10"
              >
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="p-2 space-y-0.5"
                >
                  {filters.map((item) => {
                    const active = item === filter;
                    const count = item === "all"
                      ? items.length
                      : items.filter((i) => i.collection.rarity === item).length;
                    const accent = item === "all" 
                      ? (active ? COLLECTION_THEME.accent : "#FFFFFF") 
                      : rarityColors[item];

                    return (
                      <motion.button
                        key={item}
                        variants={optionVariants}
                        type="button"
                        whileHover={{ scale: 1.012, x: 2 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          setFilter(item);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-black uppercase tracking-[0.08em] transition-all text-left cursor-pointer select-none hover:bg-white/10"
                        style={{
                          backgroundColor: active ? "#FFFFFF" : "transparent",
                          color: active ? COLLECTION_THEME.accent : "#FFFFFF",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="h-3.5 w-3.5 rounded-full border border-white border-2 shrink-0 flex items-center justify-center transition-all duration-350"
                            style={{ 
                              backgroundColor: accent,
                              transform: active ? "scale(1.1)" : "scale(1)"
                            }}
                          >
                            {active && <Check className="h-2 w-2 text-white stroke-[4.5]" />}
                          </span>
                          <span className={active ? "font-black" : "font-semibold"}>
                            {item === "all" ? "All Catches" : item}
                          </span>
                        </div>
                        <div 
                          className="rounded-full px-2.5 py-0.5 text-[14px] font-black tracking-normal transition-colors"
                          style={{ 
                            color: active ? COLLECTION_THEME.accent : "#FFFFFF"
                          }}
                        >
                          {count}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Grid Layout of Species Cards */}
      {visibleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 pt-2">
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
        <div className="pt-2">
          <PosterEmptyState
            title={filter === "all" ? "No catches yet" : `No ${filter} catches yet`}
            body="Get out there, find a new species, and this shelf will start filling up fast."
            accent={COLLECTION_THEME.accent}
            soft={COLLECTION_THEME.soft}
          />
        </div>
      )}
    </div>
  );
}
