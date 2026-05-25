import { RevealSpeciesCard } from "@/components/cards/species-card";
import { DexterEyes } from "@/components/ui/illustrations";
import { motion } from "framer-motion";
import {
  HOME_THEME,
  PRIMARY_ACTION_BUTTON_CLASS,
  STAGE_WIDTH_CLASS,
} from "@/features/home/constants";
import type { CaptureFailurePayload, CaptureResult } from "@/lib/types";
import { getThemeStyle } from "@/lib/theme";

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
  revealReady,
  failureMessage,
  onReturnToIdle,
  onResetToCamera,
}: HomeCaptureResultProps) {
  return (
    <div
      className="theme-scope flex h-full flex-1 flex-col"
      style={getThemeStyle(HOME_THEME)}
    >
      {result.kind === "new" ? (
        <>
          <div className="flex flex-1 items-center justify-center pt-4 pb-36">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`${STAGE_WIDTH_CLASS} flex flex-col items-center gap-4 text-center`}
            >
              <div className="eyebrow-badge bg-theme-accent text-white mb-4 text-xs">
                +{result.xpAwarded} XP secured
              </div>
              <div className="w-full max-w-xs drop-shadow-xl">
                <RevealSpeciesCard
                  commonName={result.card.commonName}
                  scientificName={result.card.scientificName}
                  kingdom={result.card.kingdom}
                  phylum={result.card.phylum}
                  className={result.card.className}
                  order={result.card.order}
                  family={result.card.family}
                  genus={result.card.genus}
                  species={result.card.species}
                  rarity={result.card.rarity}
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
              <p className="mt-12 max-w-72 text-sm italic leading-6 text-ink-muted font-medium drop-shadow-sm">
                Great find! This species can now be added to your DexE. Keep exploring to discover more!
              </p>
            </motion.div>
          </div>
          <div className="fab-offset fixed bottom-12 right-0 z-40 flex justify-center px-4">
            <div className="flex w-full max-w-sm flex-col gap-3">
              {revealReady ? (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="button"
                  onClick={onReturnToIdle}
                  className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-lg`}
                >
                  Add to DexE
                </motion.button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {result.kind === "duplicate" ? (
        <>
          <div className="flex flex-1 items-center justify-center pt-2 pb-8">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`${STAGE_WIDTH_CLASS} flex flex-col items-center gap-4 text-center`}
            >
              <div className="display-title !text-3xl mb-4 text-theme-accent">
                Already in your DexE
              </div>
              <div className="w-full max-w-xs grayscale-[0.12] drop-shadow-md">
                <RevealSpeciesCard
                  commonName={result.card.commonName}
                  scientificName={result.card.scientificName}
                  kingdom={result.card.kingdom}
                  phylum={result.card.phylum}
                  className={result.card.className}
                  order={result.card.order}
                  family={result.card.family}
                  genus={result.card.genus}
                  species={result.card.species}
                  rarity={result.card.rarity}
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
              <p className="mt-12 max-w-72 text-sm italic leading-6 text-ink-muted font-medium drop-shadow-sm">
                This one is already logged in your DexE, you cannot capture
                duplicates. Try finding another animal nearby!
              </p>
            </motion.div>
          </div>
          <div className="fab-offset fixed bottom-12 right-0 z-40 flex justify-center px-4">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onReturnToIdle}
                className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-md`}
              >
                Back to home
              </motion.button>
            </div>
          </div>
        </>
      ) : null}

      {captureFailure ? (
        <>
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
                {failureMessage}
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
        </>
      ) : null}
    </div>
  );
}
