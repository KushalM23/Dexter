"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Compass,
  Clock,
} from "lucide-react";

import { rarityColors, rarityCardThemes } from "@/lib/constants";
import type { PhotoSource, Rarity } from "@/lib/types";

// ==========================================
// 8-BIT VECTOR ILLUSTRATIONS (PLACEHOLDERS)
// ==========================================

// Cute Yellow Duck Mascot with Purple Cap in a puddle (User Reference Design)
function DuckMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="80" rx="30" ry="8" fill="#1A1A1A" opacity="0.15" />
      {/* Water puddle */}
      <path
        d="M 20,80 Q 35,84 50,80 Q 65,76 80,80 Q 85,82 75,84 Q 50,88 25,84 Q 15,82 20,80 Z"
        fill="#2191FB"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 30,82 Q 50,84 70,82"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Duck tail/body */}
      <path
        d="M 28,68 Q 24,55 20,52 Q 22,48 28,52 C 34,56 36,65 36,68 Z"
        fill="#FFE047"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Main Duck Body */}
      <ellipse cx="46" cy="64" rx="20" ry="14" fill="#FFD026" stroke="#1A1A1A" strokeWidth="3.5" />
      {/* Wing */}
      <path
        d="M 38,62 Q 44,56 50,60 Q 52,65 44,68 Q 38,68 38,62 Z"
        fill="#E6B800"
        stroke="#1A1A1A"
        strokeWidth="3"
      />
      
      {/* Duck Neck & Head */}
      <path d="M 52,62 L 56,42 Q 58,35 66,35 Q 74,35 74,44 L 62,64 Z" fill="#FFD026" />
      <path
        d="M 52,62 L 56,42 Q 58,35 66,35 Q 74,35 74,44 L 62,64"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="65" cy="45" r="9" fill="#FFD026" />
      {/* Head outline overlay */}
      <path
        d="M 55,46 C 54,34 68,32 73,42"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      {/* Cute smiling eye */}
      <path
        d="M 63,43 Q 65,41 67,43"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Beak */}
      <path
        d="M 72,43 C 78,43 82,45 82,49 C 82,51 77,53 71,51 Z"
        fill="#FF6B00"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <line x1="72" y1="47" x2="79" y2="47" stroke="#1A1A1A" strokeWidth="2" />
      
      {/* Purple Cap */}
      <path
        d="M 54,41 C 54,30 72,30 74,39 Z"
        fill="#7902BD"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Cap visor */}
      <path
        d="M 70,39 L 84,39 C 86,39 86,42 80,42 L 72,42 Z"
        fill="#F7D96B"
        stroke="#1A1A1A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Cap button */}
      <circle cx="64" cy="30" r="2" fill="#F7D96B" stroke="#1A1A1A" strokeWidth="1" />
    </svg>
  );
}

// Stylized Bluebird SVG (Aves)
function BirdIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="82" rx="24" ry="6" fill="#1A1A1A" opacity="0.15" />
      <path
        d="M 15,80 L 85,80 Q 88,80 85,83 L 15,83 Z"
        fill="#8B5A2B"
        stroke="#1A1A1A"
        strokeWidth="3"
      />
      <ellipse cx="48" cy="55" rx="18" ry="14" fill="#2191FB" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="58" cy="42" r="10" fill="#2191FB" stroke="#1A1A1A" strokeWidth="3.5" />
      <ellipse cx="52" cy="59" rx="11" ry="8" fill="#FFF" opacity="0.8" />
      <circle cx="61" cy="40" r="1.5" fill="#1A1A1A" />
      <path
        d="M 68,39 L 76,43 L 67,45 Z"
        fill="#FFC107"
        stroke="#1A1A1A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 31,56 L 18,52 L 24,62 Z"
        fill="#0A5EA5"
        stroke="#1A1A1A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 40,54 Q 48,46 52,54 Q 48,64 40,58 Z"
        fill="#0A5EA5"
        stroke="#1A1A1A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Retro Sprout (Plantae)
function PlantIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="85" rx="22" ry="5" fill="#1A1A1A" opacity="0.15" />
      <path
        d="M 35,65 L 65,65 L 60,85 L 40,85 Z"
        fill="#E07A5F"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect x="32" y="60" width="36" height="6" rx="2" fill="#F4F1DE" stroke="#1A1A1A" strokeWidth="3.5" />
      <rect x="36" y="58" width="28" height="4" fill="#6B513E" />
      <path d="M 50,60 Q 52,38 48,25" fill="none" stroke="#1FC147" strokeWidth="5.5" strokeLinecap="round" />
      <path
        d="M 49,42 Q 32,32 40,48 Z"
        fill="#1FC147"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 51,35 Q 68,25 60,40 Z"
        fill="#1FC147"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 48,23 C 48,23 44,12 40,15 C 38,18 45,23 48,23 Z"
        fill="#92E7A6"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Cute Forest Mushroom (Fungi)
function MushroomIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="85" rx="24" ry="6" fill="#1A1A1A" opacity="0.15" />
      <rect x="38" y="52" width="24" height="30" rx="10" fill="#FFE0C1" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="45" cy="65" r="2" fill="#1A1A1A" />
      <circle cx="55" cy="65" r="2" fill="#1A1A1A" />
      <path
        d="M 20,54 C 20,24 80,24 80,54 C 80,57 74,58 70,57 C 62,55 58,58 50,57 C 42,58 38,55 30,57 C 26,58 20,57 20,54 Z"
        fill="#E40046"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="34" r="8" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
      <circle cx="32" cy="46" r="6" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
      <circle cx="68" cy="46" r="6" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
    </svg>
  );
}

// Cyber Beetle (Insecta)
function InsectIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="80" rx="20" ry="5" fill="#1A1A1A" opacity="0.15" />
      <path
        d="M 30,35 L 20,30 M 30,50 L 16,50 M 32,65 L 18,72"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 70,35 L 80,30 M 70,50 L 84,50 M 68,65 L 82,72"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M 45,28 Q 42,16 34,18" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <path d="M 55,28 Q 58,16 66,18" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="50" cy="56" rx="20" ry="24" fill="#7902BD" stroke="#1A1A1A" strokeWidth="3.5" />
      <line x1="50" y1="32" x2="50" y2="80" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="50" cy="30" r="10" fill="#381452" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="46" cy="27" r="1.5" fill="#00D2FF" />
      <circle cx="54" cy="27" r="1.5" fill="#00D2FF" />
      <circle cx="38" cy="46" r="3" fill="#E40046" />
      <circle cx="62" cy="46" r="3" fill="#E40046" />
      <circle cx="38" cy="64" r="3" fill="#00D2FF" />
      <circle cx="62" cy="64" r="3" fill="#00D2FF" />
    </svg>
  );
}

// Cute Green Lizard (Reptilia/Amphibia)
function LizardIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="80" rx="24" ry="6" fill="#1A1A1A" opacity="0.15" />
      <path
        d="M 25,65 Q 40,78 55,75 Q 75,70 82,45 Q 85,35 80,38 Q 72,42 66,60 Z"
        fill="#1FC147"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <ellipse cx="44" cy="55" rx="16" ry="12" fill="#1FC147" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="32" cy="46" r="10" fill="#1FC147" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="28" cy="40" r="3" fill="#FFF" stroke="#1A1A1A" strokeWidth="1.5" />
      <circle cx="27" cy="40" r="1" fill="#000" />
      <circle cx="36" cy="42" r="3" fill="#FFF" stroke="#1A1A1A" strokeWidth="1.5" />
      <circle cx="35" cy="42" r="1" fill="#000" />
      <path
        d="M 38,65 L 30,78 M 46,65 L 42,79 M 54,65 L 56,76"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Cute Goldfish (Actinopterygii)
function FishIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="80" rx="24" ry="5" fill="#1A1A1A" opacity="0.15" />
      <path
        d="M 28,50 L 12,36 L 18,50 L 12,64 Z"
        fill="#FF8C00"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <ellipse cx="52" cy="50" rx="22" ry="16" fill="#FFB938" stroke="#1A1A1A" strokeWidth="3.5" />
      <ellipse cx="55" cy="53" rx="14" ry="10" fill="#FFF" opacity="0.3" />
      <circle cx="64" cy="46" r="3" fill="#FFF" stroke="#1A1A1A" strokeWidth="1.5" />
      <circle cx="65" cy="46" r="1" fill="#000" />
      <path d="M 48,34 Q 40,24 48,28 Z" fill="#FF8C00" stroke="#1A1A1A" strokeWidth="2.5" />
      <path d="M 52,66 Q 44,76 52,72 Z" fill="#FF8C00" stroke="#1A1A1A" strokeWidth="2.5" />
      <path d="M 58,56 Q 66,62 58,62 Z" fill="#FF8C00" stroke="#1A1A1A" strokeWidth="2.5" />
    </svg>
  );
}

// Default Chibi Creature
function DefaultIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="80" rx="24" ry="6" fill="#1A1A1A" opacity="0.15" />
      <ellipse cx="50" cy="50" rx="22" ry="22" fill="#E5E9ED" stroke="#1A1A1A" strokeWidth="3.5" />
      <circle cx="40" cy="45" r="5" fill="#1A1A1A" />
      <circle cx="60" cy="45" r="5" fill="#1A1A1A" />
      <circle cx="42" cy="43" r="1.5" fill="#FFF" />
      <circle cx="62" cy="43" r="1.5" fill="#FFF" />
      <path d="M 42,60 Q 50,66 58,60" fill="none" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 30,28 L 40,36 M 70,28 L 60,36" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface IllustrationProps {
  className: string;
  commonName: string;
}

function SpeciesIllustration({ className, commonName }: IllustrationProps) {
  const nameLower = commonName.toLowerCase();
  
  if (nameLower.includes("duck") || nameLower.includes("ducky") || className === "Mammalia") {
    return <DuckMascot />;
  }
  if (className === "Aves") {
    return <BirdIllustration />;
  }
  if (className === "Plantae") {
    return <PlantIllustration />;
  }
  if (className === "Fungi") {
    return <MushroomIllustration />;
  }
  if (className === "Insecta") {
    return <InsectIllustration />;
  }
  if (className === "Reptilia" || className === "Amphibia") {
    return <LizardIllustration />;
  }
  if (className === "Actinopterygii") {
    return <FishIllustration />;
  }
  return <DefaultIllustration />;
}

// 4-digit stable species Pokédex ID format: "#1279" or "#1505"
function getSpeciesId(gbifTaxonKey?: number, scientificName?: string): string {
  const num = gbifTaxonKey ? Number(gbifTaxonKey) : 0;
  if (num > 0) {
    return `${(num % 9000) + 1000}`;
  }
  if (scientificName) {
    const seed = Array.from(scientificName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `${(seed % 9000) + 1000}`;
  }
  return "1000";
}

// ==========================================
// RETRO-STYLE RETRO DECORATIONS
// ==========================================

// Retro wireframe Globe SVG
function RetroGlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-[#1A1A1A]" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

// Retro barcode stripe bar
function RetroBarcode() {
  return (
    <div className="flex items-center gap-[2px] h-3.5 opacity-85 select-none" aria-hidden="true">
      <div className="w-[1px] h-full bg-[#1A1A1A]" />
      <div className="w-[3px] h-full bg-[#1A1A1A]" />
      <div className="w-[1px] h-full bg-[#1A1A1A]" />
      <div className="w-[2.5px] h-full bg-[#1A1A1A]" />
      <div className="w-[1px] h-full bg-[#1A1A1A]" />
      <div className="w-[1.5px] h-full bg-[#1A1A1A]" />
      <div className="w-[0.7px] h-full bg-[#1A1A1A]" />
      <div className="w-[2.5px] h-full bg-[#1A1A1A]" />
    </div>
  );
}

// Retro compass icon
function RetroCompassIcon() {
  return (
    <Compass className="h-4.5 w-4.5 text-[#1A1A1A] stroke-[2.5]" />
  );
}

// ==========================================
// EXPORTS & CARD SPECIFICATIONS
// ==========================================

export interface SpeciesCardProps {
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
  gbifTaxonKey?: number;
}

export function SpeciesCard(props: SpeciesCardProps) {
  const [open, setOpen] = useState(false);

  if (props.compact) {
    return (
      <>
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className={`soft-press block w-full text-left outline-none ${
            props.disabled ? "opacity-75 grayscale" : ""
          }`}
        >
          <div className="relative mx-auto aspect-[3/4.5] w-full">
            <CardCompact {...props} />
          </div>
        </motion.button>
        <CardModal {...props} open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        className="soft-press block w-full text-left outline-none"
      >
        <div className="relative mx-auto aspect-[3/4.5] w-full">
          <CardFront {...props} />
        </div>
      </motion.button>
      <CardModal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// Rarity stripes generator: 1 for Common, 2 for Uncommon, 3 for Rare, 4 for Epic, 5 for Legendary
function RaritySlantedStripes({ rarity }: { rarity: Rarity }) {
  const filledCount = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  }[rarity];

  return (
    <div className="flex gap-[3.5px] items-center">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="w-[8px] h-[16px] transform -skew-x-[20deg]"
          style={{
            backgroundColor: idx < filledCount ? "#000000" : "rgba(0,0,0,0.25)",
            boxShadow: idx < filledCount ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// Infinite looping holographic glare sweep overlay
function CardGlareOverlay() {
  return (
    <>
      <style>{`
        @keyframes glareSweep {
          0% { background-position: -100% -100%; }
          25% { background-position: 200% 200%; }
          100% { background-position: 200% 200%; }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none z-[45] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(-45deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0) 65%)",
          backgroundSize: "250% 250%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "-100% -100%",
          animation: "glareSweep 4.5s infinite linear",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}

// Seamless vector-clipped illustration container
function IllustrationContainer({
  rarity,
  children,
  speciesId,
  notchTextColor,
  hasNotch = true,
}: {
  rarity: Rarity;
  children: React.ReactNode;
  speciesId?: string;
  notchTextColor?: string;
  hasNotch?: boolean;
}) {
  const cardTheme = rarityCardThemes[rarity];

  if (!hasNotch) {
    return (
      <div 
        className="relative w-full aspect-square mt-2 border-3 border-[#1A1A1A] rounded-lg overflow-hidden select-none"
        style={{
          background: `linear-gradient(180deg, ${cardTheme.dark} 0%, #0d0d10 100%)`,
        }}
      >
        {/* Grid Mesh Overlay */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#555_1px,transparent_1px),linear-gradient(to_bottom,#555_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
        
        {/* Centered illustration */}
        <div className="absolute inset-0 flex items-center justify-center p-6 z-0">
          <div className="relative h-[85%] aspect-square drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square mt-2 select-none">
      {/* SVG Background + Custom Border drawn with consistent rounded corners */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`illustration-gradient-${rarity}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={cardTheme.dark} />
            <stop offset="100%" stopColor="#0d0d10" />
          </linearGradient>
          <clipPath id={`illustration-clip-${rarity}`} clipPathUnits="objectBoundingBox">
            <path d="M 0.27,0 L 0.97,0 Q 1,0 1,0.03 L 1,0.97 Q 1,1 0.97,1 L 0.03,1 Q 0,1 0,0.97 L 0,0.15 Q 0,0.12 0.03,0.12 L 0.21,0.12 Q 0.24,0.12 0.24,0.09 L 0.24,0.03 Q 0.24,0 0.27,0 Z" />
          </clipPath>
        </defs>

        {/* Slanted notch shape filled with background gradient */}
        <path
          d="M 27,0 L 97,0 Q 100,0 100,3 L 100,97 Q 100,100 97,100 L 3,100 Q 0,100 0,97 L 0,15 Q 0,12 3,12 L 21,12 Q 24,12 24,9 L 24,3 Q 24,0 27,0 Z"
          fill={`url(#illustration-gradient-${rarity})`}
        />

        {/* Outlines: Draw borders around the entire container including the rounded notch */}
        <path
          d="M 27,0 L 97,0 Q 100,0 100,3 L 100,97 Q 100,100 97,100 L 3,100 Q 0,100 0,97 L 0,15 Q 0,12 3,12 L 21,12 Q 24,12 24,9 L 24,3 Q 24,0 27,0 Z"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Grid Mesh Overlay clipped to follow the slanted cut-out notch */}
      <div 
        className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#555_1px,transparent_1px),linear-gradient(to_bottom,#555_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"
        style={{
          clipPath: `url(#illustration-clip-${rarity})`,
        }}
      />

      {/* Species ID text sitting directly in the seamless borderless cut-out */}
      {speciesId && (
        <div
          className="absolute top-0 -left-1 h-[12%] w-[24%] z-10 flex items-center justify-center font-black leading-none"
          style={{
            color: '#000000',
            fontSize: "0.95rem",
            letterSpacing: "0.05em",
            paddingBottom: "3px",
          }}
        >
          #{speciesId}
        </div>
      )}

      {/* Centered illustration */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-0">
        <div className="relative h-[85%] aspect-square">
          {children}
        </div>
      </div>
    </div>
  );
}

// Compact variant: Aspect ratio 3:4.5, exact rarity color background, raised pop shadow, no XP, top-left slanted lines, top-right species code, square illustration
function CardCompact(props: SpeciesCardProps) {
  const themeColor = rarityColors[props.rarity];
  const speciesId = getSpeciesId(props.gbifTaxonKey, props.scientificName);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-3 border-[#1A1A1A] flex flex-col p-2.5 shadow-[4px_4px_0px_#1A1A1A]"
      style={{ backgroundColor: themeColor }}
    >
      {/* Holographic glare effect overlay */}
      <CardGlareOverlay />

      {/* Top Header Row of Compact card: Slanted lines in the top left, Species ID in top right */}
      <div className="flex items-center justify-between mt-0.5 px-0.5 h-4 mb-1">
        <div className="z-10 flex items-center">
          <RaritySlantedStripes rarity={props.rarity} />
        </div>
        <div className="text-sm font-mono font-black uppercase text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)]">
          #{speciesId}
        </div>
      </div>

      {/* Square Illustration Container (no notch for compact mode) */}
      <IllustrationContainer
        rarity={props.rarity}
        hasNotch={false}
      >
        <SpeciesIllustration className={props.className} commonName={props.commonName} />
      </IllustrationContainer>

      {/* Common Name Centered */}
      <div className="flex-1 flex items-center justify-center min-h-0 pt-2">
        <div
          className="text-md text-white text-left truncate w-full px-0.5 tracking-tight font-display drop-shadow-[2px_2px_0_rgba(0,0,0,1)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {props.commonName}
        </div>
      </div>
    </div>
  );
}

// Front face: Aspect 3:4.5, bold 4px border, raised shadow (8px), solid exact rarity bg, slanted lines top-left, XP top-right (not inside illustration box), seamless notch inside, location right above separating line, rarity on the right, icons on the left, dates/time on back
function CardFront(props: SpeciesCardProps) {
  const themeColor = rarityColors[props.rarity];
  const speciesIdStr = getSpeciesId(props.gbifTaxonKey, props.scientificName);
  const notchTextColor = ["common", "uncommon"].includes(props.rarity) ? "#1A1A1A" : "#FFFFFF";

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-[#000000] p-4 flex flex-col justify-between shadow-[8px_8px_0px_#000000] transition-all select-none"
      style={{ backgroundColor: themeColor }}
    >
      {/* Holographic glare effect overlay */}
      <CardGlareOverlay />

      {/* Top Header Row of Outer Card (Slanted lines in top left, XP value in top right) */}
      <div className="flex items-center justify-between py-1 mb-2 px-1 h-4.5">
        <div className="z-10 flex items-center">
          <RaritySlantedStripes rarity={props.rarity} />
        </div>
        <div className="text-md font-slackey font-black uppercase text-white">
          {props.xpValue} XP
        </div>
      </div>

      {/* Square Illustration Container with custom notch */}
      <IllustrationContainer
        rarity={props.rarity}
        speciesId={speciesIdStr}
        notchTextColor={notchTextColor}
        hasNotch={true}
      >
        <SpeciesIllustration className={props.className} commonName={props.commonName} />
      </IllustrationContainer>

      {/* Typography block with Location Right Above the separating line */}
      <div className="flex-1 flex flex-col py-4 mt-2 px-0.5">
        <div className="flex items-end justify-between select-none">
          <div className="min-w-0 flex-1">
            <div
              className="text-3xl leading-[1.0] tracking-wide text-white truncate drop-shadow-[3px_3px_0_rgba(0,0,0,1)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {props.commonName}
            </div>
            <div className="text-sm italic font-semibold text-white/90 mt-1 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
              {props.scientificName}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section Line & Rarity / Icons Row */}
      <div className="mb-2">
        <div className="h-[2.5px] bg-[#1A1A1A] w-full" />
        <div className="flex items-center justify-between pt-2 px-0.5">
          {/* Left Side: Globe & Compass & Barcode */}
          <div className="flex items-center gap-2">
            <RetroGlobeIcon />
            <RetroCompassIcon />
            <RetroBarcode />
          </div>
          {/* Right Side: Rarity */}
          <div className="text-right font-slackey font-black uppercase tracking-widest text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            {props.rarity}
          </div>
        </div>
      </div>
    </div>
  );
}

// Back face of card: Aspect 3:4.5, premium sci-fi scanning capsules, no messy tables, date in bottom-left, time in bottom-right
function CardBack(props: SpeciesCardProps) {
  const cardTheme = rarityCardThemes[props.rarity];

  const taxonomyEntries = [
    { label: "Kingdom", value: props.kingdom },
    { label: "Phylum", value: props.phylum },
    { label: "Class", value: props.className },
    { label: "Order", value: props.order },
    { label: "Family", value: props.family },
    { label: "Genus", value: props.genus },
    { label: "Sightings", value: props.occurrenceCount.toLocaleString() },
    { label: "Binomial", value: props.scientificName },
  ];

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-[#000000] p-4 flex flex-col justify-between shadow-[8px_8px_0px_#000000] text-white select-none"
      style={{
        background: `linear-gradient(180deg, ${cardTheme.dark} 0%, #0d0d10 90%)`,
      }}
    >
      {/* Holographic glare effect overlay */}
      <CardGlareOverlay />

      {/* Mesh Overlay Grid */}
      <div className="absolute inset-0 opacity-12 bg-[linear-gradient(to_right,#555_1px,transparent_1px),linear-gradient(to_bottom,#555_1px,transparent_1px)] bg-[size:14px_14px]" />

      <div className="relative z-10 flex flex-col h-full justify-between font-mono">
        
        {/* Terminal Sci-Fi Taxonomy Grid (replaces the plain messy table) */}
        <div className="flex flex-col gap-2 mt-2 text-white/90">
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            {taxonomyEntries.map((entry) => (
              <div 
                key={entry.label} 
                className="bg-white/[0.02] border border-white/[0.06] rounded-md px-2 py-1 flex items-center justify-between h-[26px]"
              >
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold leading-none">
                  {entry.label}
                </span>
                <span className="font-semibold text-[12px] text-white truncate ml-2 leading-none">
                  {entry.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monospace scrollable observations lore notes */}
        <div className="flex-1 flex flex-col overflow-hidden my-6">
          <div className="text-[12px] font-black uppercase tracking-widest text-white/60 mb-1 leading-none pb-1 border-b border-white/10">
            FIELD OBSERVATIONS
          </div>
          <div className="flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-white font-medium select-text scrollbar-thin">
            {props.lore || "A waiting entry holds details about this verified catch in the local wilderness."}
          </div>
        </div>

        {/* Footer: Date (Left) and Time (Right) - Location Removed */}
        <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/50">
          <div className="flex items-center gap-1.5">
            <span>{formatDate(props.capturedAt)}</span>
          </div>
          {formatTime(props.capturedAt) ? (
            <div className="flex items-center gap-1.5">
              <span>{formatTime(props.capturedAt)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// 3D Flippable card layer with continuous Y flipping (in inverted/backward direction)
function FlippableCard(
  props: SpeciesCardProps & {
    containerClassName?: string;
    cardHeightClass?: string;
    initialRotation?: number;
  },
) {
  const [rotation, setRotation] = useState(props.initialRotation ?? 0);

  useEffect(() => {
    if (props.initialRotation !== undefined) {
      const timer = setTimeout(() => {
        setRotation(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [props.initialRotation]);

  return (
    <div
      className={props.containerClassName ?? "species-card-shell mx-auto w-full cursor-pointer select-none"}
      style={{ perspective: 1400 }}
      onClick={() => {
        if (window.getSelection()?.toString()) return;
        setRotation((r) => r - 180); // Flip in the inverted direction
      }}
    >
      <motion.div
        className={props.cardHeightClass ?? "relative aspect-[3/4.5] w-full"}
        animate={{ rotateY: rotation }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            pointerEvents: (rotation / 180) % 2 === 0 ? "auto" : "none",
          }}
        >
          <CardFront {...props} />
        </div>
        
        {/* BACK */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            pointerEvents: (rotation / 180) % 2 !== 0 ? "auto" : "none",
          }}
        >
          <CardBack {...props} />
        </div>
      </motion.div>
    </div>
  );
}

// Modal popup utilizing a React Portal to escape CSS stacking contexts and cover everything (including binder tabs) at z-[99999]
function CardModal(props: SpeciesCardProps & { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const themeColor = rarityColors[props.rarity];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {props.open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center px-4 backdrop-blur-[6px]"
          style={{
            background: `rgba(0, 0, 0, 0.75)` // Semi-transparent backdrop with theme color tint
          }}
          onClick={props.onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full max-w-[340px]"
            onClick={(event) => event.stopPropagation()}
          >
            <FlippableCard {...props} compact={false} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

// ==========================================
// RARITY REVEAL ANIMATIONS (FRAMER MOTION)
// ==========================================



export function RevealSpeciesCard(
  props: SpeciesCardProps & {
    containerClassName?: string;
    cardHeightClass?: string;
  },
) {
  const { rarity } = props;
  const themeColor = rarityColors[rarity];

  return (
    <DramaticRevealWrapper props={props} themeColor={themeColor} />
  );
}

// Rarity Cinematic configuration detailing distinct, highly dramatic stages for each tier
type RarityCinematicConfig = {
  rumbleClass: string;
  suspenseDuration: number;
  particleCount: number;
  suspenseVortex: boolean; // Concentric stardust vortex converging into core (Legendary only)
  suspenseRings: boolean;  // Converging contracting energy rings (Epic & Legendary)
  shockwaveCount: boolean; // Multiple shockwaves (Rare, Epic, Legendary)
  continuousAura: boolean; // Continuous upward sparkles on idle float (Epic & Legendary)
  lensFlare: boolean;      // Rotating energy rays behind revealed card (Rare, Epic, Legendary)
  // Highly premium progressive fields for distinct 5-tier animation hierarchy
  stiffness: number;       // Spring drop landing weight stiffness
  damping: number;         // Spring drop landing weight damping
  suspenseScale: number[]; // Aggressive pulsing scale array during suspense
  suspenseRotate: number[];// Shaking wobble rotation array during suspense
  pulseDuration: string;   // Spinning core pulse rate
  spinDuration: string;    // Spinning core vector ring rotation speed
  flashStyle: "white" | "epic" | "legendary"; // Color overlays style for climax flash-bangs
};

const rarityCinematics: Record<Rarity, RarityCinematicConfig> = {
  common: {
    rumbleClass: "animate-rumble-mild",
    suspenseDuration: 1000,
    particleCount: 15,
    suspenseVortex: false,
    suspenseRings: false,
    shockwaveCount: false,
    continuousAura: false,
    lensFlare: false,
    stiffness: 110,
    damping: 18,
    suspenseScale: [0.85, 1.0],
    suspenseRotate: [0, 0],
    pulseDuration: "2.5s",
    spinDuration: "12s",
    flashStyle: "white",
  },
  uncommon: {
    rumbleClass: "animate-rumble-mild",
    suspenseDuration: 1400,
    particleCount: 28,
    suspenseVortex: false,
    suspenseRings: false,
    shockwaveCount: true, // Enables a single green shockwave ring ripple
    continuousAura: false,
    lensFlare: false,
    stiffness: 140,
    damping: 15,
    suspenseScale: [0.85, 1.02],
    suspenseRotate: [0, -0.5, 0.5, 0],
    pulseDuration: "2.0s",
    spinDuration: "7s",
    flashStyle: "white",
  },
  rare: {
    rumbleClass: "animate-rumble-strong",
    suspenseDuration: 1900,
    particleCount: 45,
    suspenseVortex: false,
    suspenseRings: false,
    shockwaveCount: true,
    continuousAura: false,
    lensFlare: true,
    stiffness: 180,
    damping: 12,
    suspenseScale: [0.85, 1.06],
    suspenseRotate: [0, -2, 2, -2, 2, 0],
    pulseDuration: "1.0s",
    spinDuration: "3.5s",
    flashStyle: "white",
  },
  epic: {
    rumbleClass: "animate-rumble-strong",
    suspenseDuration: 2400,
    particleCount: 65,
    suspenseVortex: false,
    suspenseRings: true,
    shockwaveCount: true,
    continuousAura: true,
    lensFlare: true,
    stiffness: 230,
    damping: 10,
    suspenseScale: [0.82, 1.15, 0.94, 1.2],
    suspenseRotate: [0, -4, 4, -4, 4, -5, 5, 0],
    pulseDuration: "0.4s",
    spinDuration: "1.2s",
    flashStyle: "epic",
  },
  legendary: {
    rumbleClass: "animate-rumble-catastrophic",
    suspenseDuration: 3200,
    particleCount: 110, // Incredible supernova explosion
    suspenseVortex: true,
    suspenseRings: true,
    shockwaveCount: true,
    continuousAura: true,
    lensFlare: true,
    stiffness: 300,
    damping: 7, // Violent bounce landing
    suspenseScale: [0.82, 1.25, 0.85, 1.35, 1.05, 1.42], // Violent heart pulsing cosmic core compression
    suspenseRotate: [0, -7, 7, -8, 8, -9, 9, -10, 10, 0], // Catastrophic twisting
    pulseDuration: "0.18s",
    spinDuration: "0.5s",
    flashStyle: "legendary",
  },
};


// Concentric contracted rings for Epic & Legendary suspense stage (clean vector design)
function SuspenseEnergyRings({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-25 flex items-center justify-center">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 0.1, opacity: [0, 0.75, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeIn",
          }}
          className="absolute w-56 h-56 rounded-full border-2"
          style={{
            borderColor: color,
            boxShadow: `0 0 15px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// Expanding outline ring shockwaves centered dynamically relative to card visual core
function ShockwaveRing({ 
  color, 
  delay = 0, 
  maxScale = 2.4, 
  duration = 0.8 
}: { 
  color: string; 
  delay?: number; 
  maxScale?: number; 
  duration?: number; 
}) {
  return (
    <motion.div
      initial={{ scale: 0.1, opacity: 0.85, x: "-50%", y: "-50%" }}
      animate={{ scale: maxScale, opacity: 0, x: "-50%", y: "-50%" }}
      transition={{ duration, ease: "easeOut", delay }}
      className="absolute left-1/2 top-1/2 w-64 h-64 rounded-full border-4 pointer-events-none z-40"
      style={{
        borderColor: color,
        boxShadow: `0 0 45px ${color}, inset 0 0 45px ${color}`,
        filter: "blur(1.5px)",
      }}
    />
  );
}



// Cinematic energy rays sweep overlay behind revealed cards
function CinematicEnergyRays({ color }: { color: string }) {
  return (
    <div className="absolute -inset-28 -z-20 pointer-events-none overflow-hidden flex items-center justify-center opacity-35 select-none">
      <svg viewBox="0 0 200 200" className="w-full h-full animate-[energy-spin_35s_infinite_linear]">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <path
              key={i}
              d="M 100 100 L 195 82 L 195 118 Z"
              fill={color}
              transform={`rotate(${angle} 100 100)`}
              style={{ mixBlendMode: "screen", opacity: i % 2 === 0 ? 0.35 : 0.6 }}
            />
          );
        })}
      </svg>
    </div>
  );
}


// Gorgeous customized DexE Mystery Card Back shown face-down during the violent rumble suspense phase
function DexECardBack({ 
  rarity, 
  pulseDuration, 
  spinDuration 
}: { 
  rarity: Rarity; 
  pulseDuration?: string; 
  spinDuration?: string; 
}) {
  const themeColor = rarityColors[rarity];

  // Escalating pulsing speeds representing higher energetic density prior to reveal
  const activePulse = pulseDuration || {
    common: "2.5s",
    uncommon: "2.0s",
    rare: "1.2s",
    epic: "0.6s",
    legendary: "0.3s",
  }[rarity];

  // Swirling ring rotation speed accelerates dramatically for higher tiers
  const activeSpin = spinDuration || {
    common: "8s",
    uncommon: "6s",
    rare: "3s",
    epic: "1.5s",
    legendary: "0.7s",
  }[rarity];

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-[#000000] p-4 flex flex-col justify-between shadow-[8px_8px_0px_#000000] bg-[#0B0D13] select-none"
    >
      <CardGlareOverlay />
      
      {/* Mesh Overlay Grid */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Cyber Brackets in Corners */}
      <div className="absolute top-2.5 left-2.5 w-4.5 h-4.5 border-t-2 border-l-2 border-white/20" />
      <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 border-t-2 border-r-2 border-white/20" />
      <div className="absolute bottom-2.5 left-2.5 w-4.5 h-4.5 border-b-2 border-l-2 border-white/20" />
      <div className="absolute bottom-2.5 right-2.5 w-4.5 h-4.5 border-b-2 border-r-2 border-white/20" />

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Pulsing colored energy bloom behind emblem */}
        <div 
          className="absolute w-36 h-36 rounded-full blur-3xl opacity-50 animate-[backdrop-pulse_2s_infinite]"
          style={{ backgroundColor: themeColor, animationDuration: activePulse }}
        />
        
        {/* Swirling vector rings */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full animate-[energy-spin_8s_infinite_linear] opacity-75"
            style={{ animationDuration: activeSpin }}
          >
            <circle cx="50" cy="50" r="45" stroke={themeColor} strokeWidth="1.5" fill="none" strokeDasharray="6, 8" />
            <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
            <path d="M 50,4 L 53,14 L 47,14 Z" fill={themeColor} />
            <path d="M 50,96 L 53,86 L 47,86 Z" fill={themeColor} />
            <path d="M 4,50 L 14,53 L 14,47 Z" fill={themeColor} />
            <path d="M 96,50 L 86,53 L 86,47 Z" fill={themeColor} />
          </svg>
          
          {/* Inner core circle containing the spinning compass */}
          <div 
            className="absolute w-18 h-18 rounded-full border-3 bg-[#151821] flex items-center justify-center shadow-lg"
            style={{ borderColor: themeColor }}
          >
            <Compass className="h-9 w-9 text-white animate-pulse" style={{ color: themeColor }} />
          </div>
        </div>
      </div>

      <div className="text-center font-slackey text-[10.5px] uppercase tracking-[0.25em] text-white/35 mb-1.5 z-10">
        D E X E &nbsp; C O R E
      </div>
    </div>
  );
}

// Comprehensive, highly premium multi-stage card reveal wrapper
function DramaticRevealWrapper({ props, themeColor }: { props: SpeciesCardProps; themeColor: string }) {
  const { rarity } = props;
  const [stage, setStage] = useState<"suspense" | "flash" | "reveal">("suspense");
  const [mounted, setMounted] = useState(false);

  // Get active rarity configuration details
  const config = rarityCinematics[rarity];

  useEffect(() => {
    setMounted(true);

    // Stage 1 -> Stage 2 (Climax Screen Flash)
    const timer1 = setTimeout(() => {
      setStage("flash");
    }, config.suspenseDuration);

    // Stage 2 -> Stage 3 (Front Face Card Drop & Particle Explosion)
    const timer2 = setTimeout(() => {
      setStage("reveal");
    }, config.suspenseDuration + 140);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [config.suspenseDuration]);

  // Render background overlays and climax flashes at the document root to escape transformed containers
  const renderBackdropAndFlash = () => {
    if (typeof window === "undefined" || !document.body) return null;
    return createPortal(
      <>
        {/* Full-screen backdrop overlay */}
        <div className="fixed inset-0 bg-black/85 z-10 pointer-events-none transition-opacity duration-700" />
        
        {/* Full-screen flash climax overlay - animated with epic flash pulses for rare tiers */}
        {stage === "flash" && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={
              config.flashStyle === "legendary"
                ? { opacity: [1, 0, 1, 0] } // Supernova double strobe flash-bang
                : config.flashStyle === "epic"
                  ? { opacity: [1, 0.2, 1] } // Fast high-intensity single strobe pulse
                  : { opacity: 1 }
            }
            transition={{ duration: 0.14, ease: "easeInOut" }}
            className="fixed inset-0 z-40 pointer-events-none" 
            style={{ backgroundColor: rarity === "legendary" || rarity === "epic" ? themeColor : "#FFFFFF" }}
          />
        )}
      </>,
      document.body
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-visible">
      <AnimationStyles />

      {/* Render Backdrop & Flash safely */}
      {renderBackdropAndFlash()}

      {/* ── STAGE 1: SUSPENSE STAGE ── */}
      {stage === "suspense" && (
        <motion.div
          initial={{ scale: 0.82, opacity: 0, rotate: 0 }}
          animate={{ 
            scale: config.suspenseScale,
            rotate: config.suspenseRotate,
            opacity: 1
          }}
          transition={{
            duration: config.suspenseDuration / 1000,
            ease: "easeInOut"
          }}
          className={`relative z-50 w-full aspect-[3/4.5] ${config.rumbleClass}`}
        >
          {/* Rarity-specific energy ring overlays (clean vector design) */}
          {config.suspenseRings && <SuspenseEnergyRings color={themeColor} />}
          
          <DexECardBack 
            rarity={rarity} 
            pulseDuration={config.pulseDuration} 
            spinDuration={config.spinDuration} 
          />
        </motion.div>
      )}

      {/* ── STAGE 3: REVEAL STAGE ── */}
      {stage === "reveal" && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 1.25 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: [1.25, 0.96, 1]
          }}
          transition={{
            y: { type: "spring", stiffness: config.stiffness, damping: config.damping },
            scale: { duration: 0.6, ease: "easeOut" }
          }}
          className="relative z-50 w-full max-w-[340px] mx-auto float-idle hover:scale-[1.02] transition-transform duration-300"
        >
          {/* Rarity rotating background energy rays */}
          {config.lensFlare && <CinematicEnergyRays color={themeColor} />}

          {/* Flippable card itself with automatic 3D spin-on-mount rotation */}
          <FlippableCard {...props} initialRotation={180} />

          {/* Radial lens glow behind the card */}
          <div
            className="absolute inset-0 -z-10 rounded-3xl blur-3xl pointer-events-none opacity-85 transition-opacity"
            style={{
              boxShadow: `0 0 80px 25px ${themeColor}77`,
            }}
          />

          {/* Centered Expanding concentric shockwave ripples as the main blast effect */}
          <ShockwaveRing 
            color={themeColor} 
            delay={0} 
            maxScale={rarity === "common" ? 2.2 : rarity === "uncommon" ? 2.4 : rarity === "rare" ? 2.6 : rarity === "epic" ? 2.8 : 3.2} 
          />
          
          {rarity !== "common" && (
            <ShockwaveRing 
              color={themeColor} 
              delay={0.12} 
              maxScale={rarity === "uncommon" ? 2.3 : rarity === "rare" ? 2.5 : rarity === "epic" ? 2.7 : 3.0} 
            />
          )}

          {["rare", "epic", "legendary"].includes(rarity) && (
            <ShockwaveRing 
              color={themeColor} 
              delay={0.2} 
              maxScale={rarity === "rare" ? 2.4 : rarity === "epic" ? 2.6 : 2.8} 
            />
          )}

          {["epic", "legendary"].includes(rarity) && (
            <ShockwaveRing 
              color={themeColor} 
              delay={0.28} 
              maxScale={rarity === "epic" ? 2.5 : 2.9} 
            />
          )}

          {rarity === "legendary" && (
            <ShockwaveRing 
              color={themeColor} 
              delay={0.36} 
              maxScale={3.1} 
            />
          )}
        </motion.div>
      )}
    </div>
  );
}

// Injects the premium rumble keyframes and physics particle CSS classes
function AnimationStyles() {
  return (
    <style>{`
      @keyframes card-rumble-mild {
        0% { transform: translate(0px, 0px) rotate(0deg); }
        20% { transform: translate(-1.5px, -1.5px) rotate(-0.5deg); }
        40% { transform: translate(2px, 1.5px) rotate(0.5deg); }
        60% { transform: translate(-2px, 2px) rotate(-1deg); }
        80% { transform: translate(1.5px, -1.5px) rotate(1deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }
      @keyframes card-rumble-strong {
        0% { transform: translate(0px, 0px) rotate(0deg); }
        10% { transform: translate(-3px, -3px) rotate(-1.5deg); }
        30% { transform: translate(3.5px, 2px) rotate(1.5deg); }
        50% { transform: translate(-4px, 3px) rotate(-2.5deg); }
        70% { transform: translate(4px, -3px) rotate(2.5deg); }
        90% { transform: translate(-3px, 3px) rotate(-1.5deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }
      @keyframes card-rumble-catastrophic {
        0% { transform: translate(0px, 0px) rotate(0deg); }
        10% { transform: translate(-6px, -5px) rotate(-2.5deg); }
        20% { transform: translate(6px, 4px) rotate(3deg); }
        30% { transform: translate(-7px, 6px) rotate(-3.5deg); }
        40% { transform: translate(7px, -5px) rotate(3.5deg); }
        50% { transform: translate(-6px, 6px) rotate(-3deg); }
        60% { transform: translate(7px, 7px) rotate(4deg); }
        70% { transform: translate(-7px, -6px) rotate(-3.5deg); }
        80% { transform: translate(8px, 7px) rotate(4.5deg); }
        90% { transform: translate(-8px, 6px) rotate(-4deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }
      @keyframes backdrop-pulse {
        0% { opacity: 0.35; transform: scale(0.95); }
        50% { opacity: 0.95; transform: scale(1.25); }
        100% { opacity: 0.35; transform: scale(0.95); }
      }
      @keyframes energy-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes float-rising {
        0% { transform: translateY(115%) scale(0); opacity: 0; }
        15% { opacity: 0.85; }
        85% { opacity: 0.85; }
        100% { transform: translateY(-15%) scale(1.4); opacity: 0; }
      }
      @keyframes holo-sheen {
        0% { background-position: -200% -200%; }
        100% { background-position: 300% 300%; }
      }
      @keyframes float-idle {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
        100% { transform: translateY(0px); }
      }
      .animate-rumble-mild {
        animation: card-rumble-mild 0.12s infinite ease-in-out;
      }
      .animate-rumble-strong {
        animation: card-rumble-strong 0.09s infinite ease-in-out;
      }
      .animate-rumble-catastrophic {
        animation: card-rumble-catastrophic 0.06s infinite ease-in-out;
      }
      .animate-holo-sheen {
        background: linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%);
        background-size: 250% 250%;
        animation: holo-sheen 3.2s infinite ease-in-out;
        mix-blend-mode: overlay;
      }
      .animate-float-rising {
        animation: float-rising var(--float-duration, 2s) infinite linear;
      }
      .float-idle {
        animation: float-idle 3.5s infinite ease-in-out;
      }
    `}</style>
  );
}

// ==========================================
// STRING / DATE OBSERVATION UTILS
// ==========================================

function shortLocation(value?: string) {
  if (!value) return "Unknown";
  return value.split(",")[0] ?? value;
}

function formatDate(value?: string) {
  if (!value) return "Unlogged";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
