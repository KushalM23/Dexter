"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Telescope,
  X,
} from "lucide-react";

import { DexterEyes, SpeciesStamp } from "@/components/ui/illustrations";
import { rarityCardThemes } from "@/lib/constants";
import type { PhotoSource, Rarity } from "@/lib/types";

interface SpeciesCardProps {
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
  pixelArtUrl?: string;
  photoSource?: PhotoSource;
  lore: string;
  occurrenceCount: number;
  locationLabel?: string;
  capturedAt?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function SpeciesCard(props: SpeciesCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -2 }}
        whileTap={{ y: 1, scale: 0.992 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="soft-press block w-full text-left"
      >
        <div className="species-card-shell relative mx-auto aspect-[0.71] w-full">
          <CardFront {...props} />
        </div>
      </motion.button>
      <CardModal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function RevealSpeciesCard(
  props: SpeciesCardProps & {
    containerClassName?: string;
    cardHeightClass?: string;
  },
) {
  return (
    <FlippableCard
      {...props}
      containerClassName={props.containerClassName}
      cardHeightClass={props.cardHeightClass}
    />
  );
}

function FlippableCard(
  props: SpeciesCardProps & {
    containerClassName?: string;
    cardHeightClass?: string;
  },
) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={props.containerClassName ?? "species-card-shell mx-auto w-full"}
      style={{ perspective: 1400 }}
      onClick={() => setFlipped((value) => !value)}
    >
      <motion.div
        className={props.cardHeightClass ?? "relative aspect-[0.71] w-full"}
        animate={{ rotateY: flipped ? 180 : 0 }}
        whileTap={{ scale: 0.992 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            pointerEvents: flipped ? "none" : "auto",
          }}
        >
          <CardFront {...props} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <CardBack {...props} />
        </div>
      </motion.div>
    </div>
  );
}

function CardFront(props: SpeciesCardProps) {
  const compact = props.compact ?? false;
  const theme = rarityCardThemes[props.rarity];
  const number = formatCardNumber(props.scientificName);

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-3xl border-4 border-[#1A1A1A] bg-[#FFF7EB] ${
        props.disabled ? "opacity-70 grayscale-[0.12]" : ""
      }`}
      style={{
        boxShadow: `0 22px 42px -22px ${theme.base}88`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFDF7_0%,#FFF3D9_100%)]" />
      <div
        className="absolute inset-x-0 top-0 h-[40%]"
        style={{
          background: `linear-gradient(180deg, ${theme.light} 0%, ${theme.accent} 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.72),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.55),transparent_20%),linear-gradient(180deg,transparent_48%,rgba(255,255,255,0.28)_100%)]" />

      <div className={`relative flex h-full flex-col ${compact ? "p-2.5" : "p-3.5"}`}>
        <div className="flex items-start justify-between gap-3 rounded-2xl border-2 border-[#1A1A1A] bg-[#FFFDF6]/95 px-3 py-2.5 shadow-lg">
          <div className="min-w-0">
            <div
              className={`${compact ? "line-clamp-2 text-lg" : "text-3xl"} leading-[0.9] tracking-[-0.05em] text-[#111111]`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {props.commonName}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-black/55">
              <span>{props.kingdom}</span>
              {!compact ? <span className="text-black/28">No.{number}</span> : null}
            </div>
          </div>
          <div className="shrink-0 rounded-xl border-2 border-[#1A1A1A] bg-white/75 px-2.5 py-2 text-right">
            <RarityStars rarity={props.rarity} />
            <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-black/65">
              {props.rarity}
            </div>
          </div>
        </div>

        <div
          className={`relative ${compact ? "mt-2.5" : "mt-3"} flex-1 overflow-hidden rounded-3xl border-4 border-[#1A1A1A]`}
          style={{
            background: `linear-gradient(180deg, ${theme.base} 0%, ${theme.light} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.65),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.55),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(15,82,186,0.08)_100%)]" />
          <div
            className="absolute -right-4 top-4 size-14 rounded-full border-4 border-[#1A1A1A]"
            style={{ backgroundColor: `${theme.accent}55` }}
          />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border-2 border-[#1A1A1A] bg-white/72 px-2.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#1A1A1A]">
            <Sparkles className="h-3 w-3" />
            Field Card
          </div>
          <div
            className="absolute bottom-5 left-4 h-5 w-20 rounded-full border-4 border-[#1A1A1A] bg-black/10"
            style={{ transform: "rotate(-10deg)" }}
          />
          <div className="absolute inset-0 px-5 pb-7 pt-6">
            <CardArt {...props} />
          </div>
        </div>

        <div className={`${compact ? "mt-2.5" : "mt-3"} rounded-2xl border-2 border-[#1A1A1A] bg-[#FFFDF8] px-3 py-3 shadow-lg`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
                Scientific Name
              </div>
              <div
                className={`mt-1 ${compact ? "text-xs" : "text-sm"} truncate italic text-[#1A1A1A]/80`}
              >
                {props.scientificName}
              </div>
            </div>
            {compact ? null : (
              <div className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-black/55">
                No.{number}
              </div>
            )}
          </div>

          <div className={`mt-3 grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
            <StatChip
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="XP"
              value={`${props.xpValue}`}
              accent={theme.base}
            />
            {!compact ? (
              <StatChip
                icon={<Telescope className="h-3.5 w-3.5" />}
                label="Sightings"
                value={abbreviate(props.occurrenceCount)}
                accent={theme.base}
              />
            ) : null}
            <StatChip
              icon={<MapPin className="h-3.5 w-3.5" />}
              label={compact ? "Where" : "Locale"}
              value={shortLocation(props.locationLabel)}
              accent={theme.base}
            />
            {compact ? (
              <StatChip
                icon={<Telescope className="h-3.5 w-3.5" />}
                label="Seen"
                value={abbreviate(props.occurrenceCount)}
                accent={theme.base}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardBack(props: SpeciesCardProps) {
  const theme = rarityCardThemes[props.rarity];
  const taxonomyEntries = [
    ["Kingdom", props.kingdom],
    ["Phylum", props.phylum],
    ["Class", props.className],
    ["Order", props.order],
    ["Family", props.family],
    ["Genus", props.genus],
  ];

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl border-4 border-[#1A1A1A]"
      style={{
        background: `linear-gradient(180deg, ${theme.dark} 0%, #1A1A1A 68%)`,
        boxShadow: `0 18px 36px -18px ${theme.base}88`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_90%_16%,rgba(255,255,255,0.12),transparent_20%)]" />
      <div className="relative flex h-full flex-col p-3.5 text-white">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/14 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
              Field Dossier
            </div>
            <div
              className="mt-2 text-2xl leading-[0.92] tracking-[-0.05em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {props.commonName}
            </div>
            <div className="mt-2 text-xs italic text-white/72">
              {props.scientificName}
            </div>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/80">
            Tap to flip
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-white/15 bg-white/8 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
              Taxonomy
            </div>
            <div className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/70">
              Verified
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {taxonomyEntries.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/12 bg-[#F7FBFF] px-3 py-3 text-[#10263D]"
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#10263D]/55">
                  {label}
                </div>
                <div className="mt-1 text-xs font-semibold leading-5">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-2xl border border-white/12 bg-[#D8ECFF] px-3 py-3 text-[#10263D]">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#10263D]/55">
              Species
            </div>
            <div className="mt-1 text-sm font-semibold leading-5">
              {props.scientificName}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-white/15 bg-[#FFF7EB] px-4 py-4 text-[#1A1A1A]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-black/48">
            Field notes
          </div>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-black/72">
            {props.lore || "A fresh entry is waiting for the next verified field note."}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <DetailBlock label="Caught" value={formatCapturedAt(props.capturedAt)} />
          <DetailBlock label="Source" value={props.photoSource ?? "silhouette"} />
          <DetailBlock label="Location" value={props.locationLabel || "Unknown"} />
          <DetailBlock label="Rarity" value={props.rarity} accent={theme.accent} />
        </div>
      </div>
    </div>
  );
}

function CardArt(props: SpeciesCardProps) {
  const artSrc = props.pixelArtUrl || props.photoUrl || "";

  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-4 border-dashed border-[#1A1A1A] bg-white/28">
        <div className="absolute inset-x-[14%] bottom-[16%] h-4 rounded-full bg-black/10 blur-md" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.88),transparent_30%)]" />

        <div className="relative flex h-full w-full items-center justify-center px-4 py-5">
          {artSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artSrc}
              alt={props.commonName}
              className="max-h-full w-auto object-contain drop-shadow-lg"
              loading="lazy"
            />
          ) : (
            <div className="size-20">
              <SpeciesStamp className={props.className} rarity={props.rarity} />
            </div>
          )}
        </div>

        <div className="absolute left-3 top-3 rounded-full border-2 border-[#1A1A1A] bg-white/88 px-2.5 py-1.5">
          <DexterEyes size={26} color="#2191FB" />
        </div>
        <div className="absolute bottom-3 right-3 size-16 rounded-2xl border-4 border-[#1A1A1A] bg-[#FFF7EB] p-1.5 shadow-lg">
          <div className="h-full w-full overflow-hidden rounded-xl">
            <SpeciesStamp className={props.className} rarity={props.rarity} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border-2 border-[#1A1A1A] px-2.5 py-2"
      style={{ backgroundColor: `${accent}18` }}
    >
      <div className="flex items-center gap-1.5 text-black/68">{icon}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-black/45">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-black uppercase tracking-[0.04em] text-[#1A1A1A]">
        {value}
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3 backdrop-blur-sm"
      style={accent ? { boxShadow: `inset 0 0 0 1px ${accent}40` } : undefined}
    >
      <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-white/88">{value}</div>
    </div>
  );
}

function RarityStars({ rarity }: { rarity: Rarity }) {
  const count = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  }[rarity];

  return (
    <div className="flex justify-end gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <Star
          key={index}
          className="h-3.5 w-3.5 fill-[#1A1A1A] text-[#1A1A1A]"
        />
      ))}
    </div>
  );
}

function CardModal(
  props: SpeciesCardProps & { open: boolean; onClose: () => void },
) {
  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="species-modal-panel fixed inset-0 z-[9999] flex items-center justify-center bg-black/78 px-4"
          onClick={props.onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={props.onClose}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
            <FlippableCard {...props} compact={false} />
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                <RotateCcw className="h-4 w-4" />
                Tap card to flip
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function abbreviate(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return `${value}`;
}

function formatCardNumber(scientificName: string) {
  const seed = Array.from(scientificName).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return `${seed % 9999}`.padStart(4, "0");
}

function shortLocation(value?: string) {
  if (!value) return "Unknown";
  return value.split(",")[0] ?? value;
}

function formatCapturedAt(value?: string) {
  if (!value) return "Unlogged";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
