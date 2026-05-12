"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, Sparkles, Stars } from "lucide-react";

import { rarityColors } from "@/lib/constants";
import { SpeciesStamp } from "@/components/illustrations";
import type { Rarity } from "@/lib/types";

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
  lore: string;
  occurrenceCount: number;
  locationLabel?: string;
  capturedAt?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function SpeciesCard(props: SpeciesCardProps) {
  const [flipped, setFlipped] = useState(false);
  const tint = rarityColors[props.rarity];
  const secondary = `${tint}22`;

  if (props.compact) {
    return (
      <button
        type="button"
        onClick={() => setFlipped(true)}
        className="w-full text-left"
      >
        <div
          className="overflow-hidden rounded-[28px] border-[3px] border-[#1A1A1A] p-3 shadow-[0_14px_25px_rgba(26,26,26,0.12)]"
          style={{ background: `linear-gradient(180deg, ${secondary}, #fffef8)` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.2em]"
              style={{ backgroundColor: tint, color: "#FAFAFF" }}
            >
              {props.rarity}
            </span>
            <span className="text-xs font-bold text-black/50">{props.xpValue} XP</span>
          </div>
          <div className="mb-3 aspect-[1.1/1] overflow-hidden rounded-[22px] border-[3px] border-black/10 bg-white/90 p-3">
            <SpeciesStamp className={props.className} rarity={props.rarity} />
          </div>
          <div className="font-[family:var(--font-display)] text-xl leading-none">
            {props.commonName}
          </div>
          <div className="mt-1 text-xs italic text-black/55">{props.scientificName}</div>
        </div>
        <CardModal {...props} open={flipped} onClose={() => setFlipped(false)} />
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setFlipped(true)} className="w-full text-left">
        <CardFace {...props} />
      </button>
      <CardModal {...props} open={flipped} onClose={() => setFlipped(false)} />
    </>
  );
}

function CardFace(props: SpeciesCardProps) {
  const tint = rarityColors[props.rarity];

  return (
    <div
      className="overflow-hidden rounded-[34px] border-[4px] border-[#1A1A1A] p-4 shadow-[0_18px_36px_rgba(26,26,26,0.16)]"
      style={{
        background: `linear-gradient(180deg, ${tint} 0%, ${tint}99 35%, #1A1A1A 160%)`,
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white">
          {props.rarity}
        </span>
        <div className="flex items-center gap-1 text-sm font-bold text-white">
          <Stars className="h-4 w-4" />
          {props.xpValue}
        </div>
      </div>
      <div className="mb-4 aspect-[1.02/0.98] overflow-hidden rounded-[26px] border-[3px] border-white/30 bg-[#fffef8] p-4">
        <SpeciesStamp className={props.className} rarity={props.rarity} />
      </div>
      <div className="font-[family:var(--font-display)] text-[2rem] leading-[0.9] text-white">
        {props.commonName}
      </div>
      <div className="mt-2 text-sm italic text-white/80">{props.scientificName}</div>
      <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/80">
        <span>{props.kingdom}</span>
        <span>{props.locationLabel ?? "Field Capture"}</span>
      </div>
    </div>
  );
}

function CardModal(
  props: SpeciesCardProps & { open: boolean; onClose: () => void },
) {
  const tint = rarityColors[props.rarity];

  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
          onClick={props.onClose}
        >
          <motion.div
            initial={{ scale: 0.84, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative w-full max-w-[360px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="rounded-[34px] border-[4px] border-[#1A1A1A] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)]"
              style={{
                background: `linear-gradient(180deg, #191919, ${tint} 160%)`,
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="font-[family:var(--font-display)] text-3xl leading-none">
                  {props.commonName}
                </div>
                <button
                  type="button"
                  onClick={props.onClose}
                  className="rounded-full bg-white/14 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Close
                </button>
              </div>

              <div className="mb-5 rounded-[28px] bg-white/10 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <TaxRow label="Kingdom" value={props.kingdom} />
                  <TaxRow label="Phylum" value={props.phylum} />
                  <TaxRow label="Class" value={props.className} />
                  <TaxRow label="Order" value={props.order} />
                  <TaxRow label="Family" value={props.family} />
                  <TaxRow label="Genus" value={`${props.genus} ${props.species}`} />
                </div>
              </div>

              <div className="rounded-[28px] bg-white/92 p-4 text-[#1A1A1A]">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black/55">
                  <Sparkles className="h-4 w-4" />
                  Field Notes
                </div>
                <p className="text-sm leading-6 text-black/75">{props.lore}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
                  <StatPill label="Rarity" value={props.rarity} tint={tint} />
                  <StatPill label="Recorded" value={props.occurrenceCount.toLocaleString()} tint={tint} />
                  <StatPill label="XP" value={`${props.xpValue}`} tint={tint} />
                  <StatPill label="Photo" value="Silhouette" tint={tint} />
                </div>

                {(props.locationLabel || props.capturedAt) ? (
                  <div className="mt-5 space-y-2 text-sm font-medium text-black/60">
                    {props.locationLabel ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {props.locationLabel}
                      </div>
                    ) : null}
                    {props.capturedAt ? (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(props.capturedAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function TaxRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/10 px-3 py-3">
      <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/60">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div
      className="rounded-[18px] border-[2px] px-3 py-3"
      style={{ borderColor: `${tint}55`, backgroundColor: `${tint}12` }}
    >
      <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-black/50">
        {label}
      </div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}
