import { RevealSpeciesCard } from "@/components/cards/species-card";
import { DexterEyes } from "@/components/ui/illustrations";
import { motion } from "framer-motion";
import {
  HOME_THEME,
  PRIMARY_ACTION_BUTTON_CLASS,
} from "@/features/home/constants";
import type { CaptureFailurePayload, CaptureResult, Rarity } from "@/lib/types";
import { getThemeStyle } from "@/lib/theme";
import { rarityColors } from "@/lib/constants";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

type HomeCaptureResultProps = {
  result: CaptureResult;
  captureFailure: CaptureFailurePayload | null;
  revealReady: boolean;
  failureMessage: string;
  onReturnToIdle: () => void;
  onResetToCamera: () => void;
};

export function HomeCaptureResult({
  result,
  captureFailure,
  revealReady: parentRevealReady,
  failureMessage,
  onReturnToIdle,
  onResetToCamera,
}: HomeCaptureResultProps) {
  const [mounted, setMounted] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [overrideRarity, setOverrideRarity] = useState<Rarity | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [localRevealReady, setLocalRevealReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeRarity = (overrideRarity || (
    result.kind === "new" ? result.card.rarity :
    result.kind === "duplicate" ? result.card.rarity :
    "common"
  )) as Rarity;

  // Dynamically calculate the duration of the dramatic reveal sequence based on card rarity
  const revealDuration = {
    common: 1000 + 350,
    uncommon: 1400 + 350,
    rare: 1900 + 350,
    epic: 2400 + 350,
    legendary: 3200 + 350,
  }[activeRarity];

  // Keep local reveal ready state perfectly synchronized with actual animations
  useEffect(() => {
    if (result.kind === "error") return;
    
    setLocalRevealReady(false);
    const timeout = setTimeout(() => {
      setLocalRevealReady(true);
    }, revealDuration);

    return () => clearTimeout(timeout);
  }, [activeRarity, revealKey, revealDuration, result.kind]);

  if (!mounted) return null;

  // 1. Render explicit captureFailure screen in the normal layout flow
  if (captureFailure) {
    return (
      <div
        className="theme-scope flex h-full flex-1 flex-col"
        style={getThemeStyle(HOME_THEME)}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex flex-1 flex-col pt-8 pb-24"
        >
          <div className="shrink-0">
            <div className="display-title !text-[2.8rem] text-theme-accent">
              {captureFailure.kind === "invalid"
                ? "No wild subject found"
                : captureFailure.kind === "low_confidence"
                  ? "Missed this time"
                  : "Something went wrong!"}
            </div>
            <p className="mt-10 max-w-72 text-base leading-relaxed text-foreground font-medium">
              {failureMessage || captureFailure.message}
            </p>
          </div>

          <div className="flex mt-16 flex-1 flex-col items-center justify-center">
            <motion.div
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
              className="origin-center"
            >
              <DexterEyes size={220} />
            </motion.div>

            <div
              className="mt-8 h-4 w-40 rounded-[50%] opacity-25 bg-black blur-[6px]"
            />
          </div>
        </motion.div>

        <div className="fab-offset fixed bottom-12 right-0 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-sm flex-col gap-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onResetToCamera}
              className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-md`}
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Cinematic full-screen portal for successful catches
  if (result.kind === "new") {
    return createPortal(
      <div
        className="theme-scope fixed inset-0 z-[99999] flex flex-col justify-between bg-[#0B0D13] text-white select-none overflow-hidden"
        style={getThemeStyle(HOME_THEME)}
      >
        {/* Developer Sandbox Panel Gear Toggle */}
        <div className="absolute top-6 right-6 z-[100001]">
          <button
            type="button"
            onClick={() => setShowDevMenu(!showDevMenu)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center font-bold"
            title="Developer Rarity Test Sandbox"
          >
            <Settings className="w-5 h-5 animate-[spin_6s_linear_infinite] hover:animate-[spin_2s_linear_infinite]" />
          </button>
        </div>

        {/* Developer Sandbox Panel Dropdown Menu */}
        {showDevMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 right-6 z-[100001] bg-[#151821]/95 border border-white/10 rounded-2xl p-4 w-60 shadow-2xl backdrop-blur-md"
          >
            <div className="text-[10px] font-slackey uppercase tracking-wider text-theme-accent mb-3 flex items-center justify-between">
              <span>Rarity Sandbox</span>
              <button 
                onClick={() => {
                  setOverrideRarity(null);
                  setRevealKey(prev => prev + 1);
                  setShowDevMenu(false);
                }}
                className="text-[9px] lowercase text-white/40 hover:text-white underline cursor-pointer"
              >
                reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(["common", "uncommon", "rare", "epic", "legendary"] as const).map((r) => {
                const isActive = activeRarity === r;
                const color = rarityColors[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setOverrideRarity(r);
                      setRevealKey((k) => k + 1);
                    }}
                    className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer"
                    style={{
                      border: `1px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`,
                      backgroundColor: isActive ? `${color}15` : "transparent",
                      color: isActive ? color : "rgba(255,255,255,0.7)"
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {r}
                    </span>
                    {isActive && <span className="text-[9px] text-white/40">Active</span>}
                  </button>
                );
              })}
            </div>
            
            <button
              type="button"
              onClick={() => setRevealKey((k) => k + 1)}
              className="mt-3.5 w-full py-2 bg-theme-accent/20 border border-theme-accent/40 rounded-xl text-xs font-mono text-theme-accent uppercase hover:bg-theme-accent/30 active:scale-[0.98] cursor-pointer transition-all"
            >
              Replay Animation
            </button>
          </motion.div>
        )}

        {/* Mesh Overlay Grid for technical background vibe */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Floating particles background inside portal for immersive feel */}
        <div className="absolute inset-0 pointer-events-none texture-overlay opacity-15" />

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
          >
            {/* XP Awarded badge - only after card reveal is complete */}
            {localRevealReady && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="eyebrow-badge text-white mb-2 text-xs font-black shadow-lg"
                style={{ backgroundColor: rarityColors[activeRarity] }}
              >
                +{result.xpAwarded} XP SECURED
              </motion.div>
            )}

            {/* The Cinematic Species Card Reveal wrapper */}
            <div className="w-full max-w-[340px] drop-shadow-[0_15px_35px_rgba(0,0,0,0.65)] relative my-2">
              <RevealSpeciesCard
                key={`${activeRarity}-${revealKey}`}
                commonName={result.card.commonName}
                scientificName={result.card.scientificName}
                kingdom={result.card.kingdom}
                phylum={result.card.phylum}
                className={result.card.className}
                order={result.card.order}
                family={result.card.family}
                genus={result.card.genus}
                species={result.card.species}
                rarity={activeRarity}
                xpValue={result.xpAwarded || result.card.xpValue}
                photoUrl={result.card.photoUrl}
                pixelArtUrl={result.card.pixelArtUrl}
                photoSource={result.card.photoSource}
                lore={result.card.lore}
                occurrenceCount={result.card.occurrenceCount}
                locationLabel={result.collection?.captureLocationLabel}
                capturedAt={result.collection?.capturedAt}
                gbifTaxonKey={result.card.gbifTaxonKey || result.collection?.gbifTaxonKey}
              />
            </div>

            {/* Description note fades in after card reveal is complete */}
            {localRevealReady && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-4 max-w-xs text-[13px] italic leading-relaxed text-white/80 font-medium drop-shadow-sm select-text"
              >
                Great find! This species can now be added to your DexE. Keep exploring to discover more!
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Button action container at the bottom (nested in flexbox flow for perfect spacing) */}
        <div className="w-full max-w-sm mx-auto px-4 pb-12 pt-2 z-50">
          <div className="flex w-full flex-col gap-3">
            {localRevealReady && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onReturnToIdle}
                className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-2xl hover:brightness-110`}
                style={{ backgroundColor: rarityColors[activeRarity] }}
              >
                Add to DexE
              </motion.button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. Cinematic full-screen portal for duplicate catches
  if (result.kind === "duplicate") {
    return createPortal(
      <div
        className="theme-scope fixed inset-0 z-[99999] flex flex-col justify-between bg-[#0B0D13] text-white select-none overflow-hidden"
        style={getThemeStyle(HOME_THEME)}
      >
        {/* Developer Sandbox Panel Gear Toggle */}
        <div className="absolute top-6 right-6 z-[100001]">
          <button
            type="button"
            onClick={() => setShowDevMenu(!showDevMenu)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center font-bold"
            title="Developer Rarity Test Sandbox"
          >
            <Settings className="w-5 h-5 animate-[spin_6s_linear_infinite] hover:animate-[spin_2s_linear_infinite]" />
          </button>
        </div>

        {/* Developer Sandbox Panel Dropdown Menu */}
        {showDevMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 right-6 z-[100001] bg-[#151821]/95 border border-white/10 rounded-2xl p-4 w-60 shadow-2xl backdrop-blur-md"
          >
            <div className="text-[10px] font-slackey uppercase tracking-wider text-theme-accent mb-3 flex items-center justify-between">
              <span>Rarity Sandbox</span>
              <button 
                onClick={() => {
                  setOverrideRarity(null);
                  setRevealKey(prev => prev + 1);
                  setShowDevMenu(false);
                }}
                className="text-[9px] lowercase text-white/40 hover:text-white underline cursor-pointer"
              >
                reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(["common", "uncommon", "rare", "epic", "legendary"] as const).map((r) => {
                const isActive = activeRarity === r;
                const color = rarityColors[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setOverrideRarity(r);
                      setRevealKey((k) => k + 1);
                    }}
                    className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer"
                    style={{
                      border: `1px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`,
                      backgroundColor: isActive ? `${color}15` : "transparent",
                      color: isActive ? color : "rgba(255,255,255,0.7)"
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {r}
                    </span>
                    {isActive && <span className="text-[9px] text-white/40">Active</span>}
                  </button>
                );
              })}
            </div>
            
            <button
              type="button"
              onClick={() => setRevealKey((k) => k + 1)}
              className="mt-3.5 w-full py-2 bg-theme-accent/20 border border-theme-accent/40 rounded-xl text-xs font-mono text-theme-accent uppercase hover:bg-theme-accent/30 active:scale-[0.98] cursor-pointer transition-all"
            >
              Replay Animation
            </button>
          </motion.div>
        )}

        {/* Mesh Overlay Grid for technical background vibe */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Floating particles background inside portal for immersive feel */}
        <div className="absolute inset-0 pointer-events-none texture-overlay opacity-15" />

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
          >
            <div 
              className="display-title !text-3xl mb-2 font-black tracking-tight drop-shadow-md"
              style={{ color: rarityColors[activeRarity] }}
            >
              Already in your DexE
            </div>

            <div className="w-full max-w-[340px] grayscale-[0.12] drop-shadow-[0_15px_35px_rgba(0,0,0,0.55)] my-2">
              <RevealSpeciesCard
                key={`${activeRarity}-${revealKey}`}
                commonName={result.card.commonName}
                scientificName={result.card.scientificName}
                kingdom={result.card.kingdom}
                phylum={result.card.phylum}
                className={result.card.className}
                order={result.card.order}
                family={result.card.family}
                genus={result.card.genus}
                species={result.card.species}
                rarity={activeRarity}
                xpValue={result.card.xpValue}
                photoUrl={result.card.photoUrl}
                pixelArtUrl={result.card.pixelArtUrl}
                photoSource={result.card.photoSource}
                lore={result.card.lore}
                occurrenceCount={result.card.occurrenceCount}
                locationLabel={result.card.scientificName}
                gbifTaxonKey={result.card.gbifTaxonKey}
              />
            </div>

            {localRevealReady && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-4 max-w-xs text-[13px] italic leading-relaxed text-white/80 font-medium drop-shadow-sm"
              >
                This one is already logged in your DexE, you cannot capture duplicates. Try finding another animal nearby!
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Button action container at the bottom (nested in flexbox flow for perfect spacing) */}
        <div className="w-full max-w-sm mx-auto px-4 pb-12 pt-2 z-50">
          <div className="flex w-full flex-col gap-3">
            {localRevealReady && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onReturnToIdle}
                className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-2xl hover:brightness-110`}
                style={{ backgroundColor: rarityColors[activeRarity] }}
              >
                Back to home
              </motion.button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 4. Render failure or general error screen in the normal layout flow
  return (
    <div
      className="theme-scope flex h-full flex-1 flex-col"
      style={getThemeStyle(HOME_THEME)}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-1 flex-col pt-8 pb-24"
      >
        <div className="shrink-0">
          <div className="display-title !text-[2.8rem] text-theme-accent">
            Something went wrong!
          </div>
          <p className="mt-10 max-w-72 text-base leading-relaxed text-foreground font-medium">
            {result.kind === "error" ? result.message : failureMessage || "An error occurred."}
          </p>
        </div>

        <div className="flex mt-16 flex-1 flex-col items-center justify-center">
          <motion.div
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
            className="origin-center"
          >
            <DexterEyes size={220} />
          </motion.div>

          <div
            className="mt-8 h-4 w-40 rounded-[50%] opacity-25 bg-black blur-[6px]"
          />
        </div>
      </motion.div>

      <div className="fab-offset fixed bottom-12 right-0 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onResetToCamera}
            className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-md`}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    </div>
  );
}
