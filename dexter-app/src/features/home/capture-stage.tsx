import Image from "next/image";
import { useRef, useState, type Ref } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, ArrowRight } from "lucide-react";
import { DexterEyes } from "@/components/ui/illustrations";

import {
  CAPTURE_TRIGGER_BUTTON_CLASS,
  CAPTURE_TRIGGER_INNER_CLASS,
  HOME_THEME,
  PRIMARY_ACTION_BUTTON_CLASS,
  SCANNING_PHRASES,
} from "@/features/home/constants";
import type { HomeScreenMode } from "@/features/home/types";
import { getThemeStyle } from "@/lib/theme";

type CaptureStageMode = Extract<
  HomeScreenMode,
  "camera" | "preview" | "processing"
>;

type HomeCaptureStageProps = {
  mode: CaptureStageMode;
  captureData: string | null;
  cameraError: string | null;
  scanningPhraseIndex: number;
  videoRef: Ref<HTMLVideoElement>;
  isPending: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onClose: () => void;
  onReturnHome: () => void;
  onTakeShot: () => void;
  onConfirmCapture: () => void;
  onResetToCamera: () => void;
};

export function HomeCaptureStage({
  mode,
  captureData,
  cameraError,
  scanningPhraseIndex,
  videoRef,
  isPending,
  zoom,
  onZoomChange,
  onClose,
  onReturnHome,
  onTakeShot,
  onConfirmCapture,
  onResetToCamera,
}: HomeCaptureStageProps) {
  const heading = SCANNING_PHRASES[scanningPhraseIndex];

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startVRef = useRef(0);

  // Convert zoom to slider index value v (0 to 3)
  let v = 0;
  if (zoom >= 1 && zoom <= 2) {
    v = zoom - 1;
  } else if (zoom > 2 && zoom <= 4) {
    v = 1 + (zoom - 2) / 2;
  } else if (zoom > 4 && zoom <= 10) {
    v = 2 + (zoom - 4) / 6;
  }

  const handleSliderChange = (val: number) => {
    // Magnetic snapping: if val is very close to index 0, 1, 2, or 3, snap it!
    const index = Math.round(val);
    if (Math.abs(val - index) < 0.12) {
      val = index;
    }

    let nextZoom = 1;
    if (val >= 0 && val <= 1) {
      nextZoom = 1 + val;
    } else if (val > 1 && val <= 2) {
      nextZoom = 2 + (val - 1) * 2;
    } else if (val > 2 && val <= 3) {
      nextZoom = 4 + (val - 2) * 6;
    }
    // Round to 2 decimal places to prevent floating point inaccuracies
    onZoomChange(Math.round(nextZoom * 100) / 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    trackRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const isPresetButton = (e.target as HTMLElement).closest("button");
    if (isPresetButton) {
      startXRef.current = e.clientX;
      startVRef.current = v; // Start dragging directly from the preset's value
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const padding = 4;
    const thumbWidth = 48; // Pill thumb width (48px)
    const dragWidth = rect.width - padding * 2 - thumbWidth;

    const relativeX = e.clientX - rect.left - padding - thumbWidth / 2;
    const percentage = Math.max(0, Math.min(1, relativeX / dragWidth));
    const initialV = percentage * 3;

    startXRef.current = e.clientX;
    startVRef.current = initialV;

    handleSliderChange(initialV);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const padding = 4;
    const thumbWidth = 48; // Pill thumb width (48px)
    const dragWidth = rect.width - padding * 2 - thumbWidth;

    const deltaX = e.clientX - startXRef.current;
    const deltaV = (deltaX / dragWidth) * 3;
    const nextV = Math.max(0, Math.min(3, startVRef.current + deltaV));

    handleSliderChange(nextV);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (trackRef.current) {
      try {
        trackRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe catch
      }
    }
  };

  const handlePresetPointerDown = (preset: number, e: React.PointerEvent) => {
    onZoomChange(preset);
  };

  return (
    <>
      <div
        className="theme-scope fixed inset-0 left-10 z-30 overflow-hidden bg-[#111111] sm:left-14"
        style={getThemeStyle(HOME_THEME)}
      >
        <motion.div
          initial={{ filter: "blur(12px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          exit={{ filter: "blur(12px)", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="relative h-full w-full"
        >
          {mode === "camera" ? (
            <motion.video
              ref={videoRef}
              className="h-full w-full object-cover origin-center"
              playsInline
              muted
              animate={{ scale: zoom }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          ) : null}

          {mode === "preview" || mode === "processing" ? (
            <>
              <Image
                src={captureData ?? ""}
                alt="Preview"
                fill
                unoptimized
                className={`object-cover ${
                  mode === "processing" ? "brightness-[0.45]" : ""
                }`}
              />
              {mode === "preview" && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 z-50 bg-[#111111]"
                />
              )}
            </>
          ) : null}

          {mode === "processing" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-md">
              <LogoEyeLoader />
              <motion.div
                key={SCANNING_PHRASES[scanningPhraseIndex]}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="display-hero mt-6 max-w-72 text-center !text-xl tracking-tight text-white shadow-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                {heading}
              </motion.div>
            </div>
          ) : null}
        </motion.div>
      </div>

      <div className="fixed inset-0 left-10 z-40 flex flex-col pointer-events-none sm:left-14">
        <div className="pointer-events-auto flex w-full items-center justify-between px-6 pb-6 pt-10">
          <div className="h-12 w-12 shrink-0" />
          <div className="h-12 w-12 shrink-0" />
        </div>

        {mode === "camera" && cameraError ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto absolute inset-0 flex flex-col bg-background px-4 pb-24 pt-16"
          >
            <div className="shrink-0 pt-2">
              <div className="display-title text-theme-accent drop-shadow-sm">
                Camera unavailable
              </div>
              <p className="mt-5 max-w-xs text-base leading-relaxed text-foreground/80 font-medium">
                {cameraError}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <motion.div
                animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
                className="origin-center"
              >
                <DexterEyes size={220} />
              </motion.div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center px-4">
              <div className="flex w-full max-w-98 flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onReturnHome}
                  className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-md`}
                >
                  Back to home
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}

        <div className="pointer-events-auto mt-auto flex w-full flex-col items-center gap-6 px-4 pb-10">
          {mode === "camera" && !cameraError ? (
            <>
              {/* Unified Draggable Presets Slider Panel (Sleek Subtle Pill Design) */}
              <div
                ref={trackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-56 h-8 bg-black/15 border border-white/5 rounded-full flex items-center justify-between px-1 backdrop-blur-md shadow-md select-none mb-3 overflow-hidden touch-none cursor-pointer"
              >
                {/* Preset Indicator Labels */}
                {[1, 2, 4, 10].map((preset, index) => {
                  const distance = Math.abs(v - index);
                  const opacity = Math.min(1, distance * 2);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onPointerDown={(e) => handlePresetPointerDown(preset, e)}
                      style={{
                        left: `calc(8px + ${(index / 3)} * (100% - 56px))`,
                        opacity: opacity
                      }}
                      className="absolute z-10 w-10 h-6 text-[9.5px] font-bold text-white/45 hover:text-white/75 transition-opacity flex items-center justify-center pointer-events-auto cursor-pointer"
                    >
                      {preset}x
                    </button>
                  );
                })}

                {/* Floating Sleek Pill Thumb with Integrated Number */}
                <div
                  style={{
                    left: `calc(4px + ${(v / 3)} * (100% - 56px))`
                  }}
                  className="absolute z-20 h-6 w-12 rounded-full bg-theme-accent text-white font-black text-[9.5px] shadow-[0_1.5px_4px_rgba(0,0,0,0.3)] flex items-center justify-center pointer-events-none transition-all duration-75 ease-out origin-center"
                >
                  {zoom % 1 === 0 ? `${zoom.toFixed(0)}x` : `${zoom.toFixed(1)}x`}
                </div>
              </div>

              <div className="h-[84px] w-[84px]" />
            </>
          ) : null}

          {mode === "processing" ? <div className="min-h-30" /> : null}
        </div>
      </div>

      {mode === "preview" ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none fixed bottom-12 left-10 right-0 z-40 flex justify-center px-4 sm:left-14"
        >
          <div className="pointer-events-auto mx-auto flex w-full max-w-98 flex-row items-stretch justify-center gap-3 text-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onResetToCamera}
              className="flex h-auto aspect-square shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg transition-[box-shadow,filter] active:scale-95 border border-black/5"
              aria-label="Retry"
            >
              <RotateCcw
                className="h-7 w-7 text-theme-accent"
                strokeWidth={3}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onConfirmCapture}
              disabled={isPending}
              className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-lg flex flex-1 flex-row items-center justify-center gap-2`}
            >
              Confirm <ArrowRight className="w-6 h-6" strokeWidth={3} />
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}

function LogoEyeLoader() {
  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="h-20 w-50" aria-hidden="true">
        <ellipse
          cx="62"
          cy="60"
          rx="42"
          ry="44"
          fill="white"
          stroke="var(--border-strong)"
          strokeWidth="5"
        />
        <motion.circle
          cx="62"
          cy="60"
          r="26"
          fill="var(--theme-accent)"
          animate={{ scale: [1, 0.92, 1], opacity: [1, 0.92, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="62" cy="60" r="16" fill="white" fillOpacity="0.4" />
        <motion.circle
          cx="62"
          cy="58"
          r="9"
          fill="var(--border-strong)"
          animate={{ cx: [54, 70, 62, 54], cy: [58, 54, 64, 58] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="57"
          cy="50"
          r="5"
          fill="white"
          fillOpacity="0.8"
          animate={{ cx: [52, 64, 59, 52], cy: [49, 46, 55, 49] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <ellipse
          cx="138"
          cy="60"
          rx="42"
          ry="44"
          fill="white"
          stroke="var(--border-strong)"
          strokeWidth="5"
        />
        <motion.circle
          cx="138"
          cy="60"
          r="26"
          fill="var(--theme-accent)"
          animate={{ scale: [1, 0.92, 1], opacity: [1, 0.92, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="138" cy="60" r="16" fill="white" fillOpacity="0.4" />
        <motion.circle
          cx="138"
          cy="58"
          r="9"
          fill="var(--border-strong)"
          animate={{ cx: [130, 146, 138, 130], cy: [58, 54, 64, 58] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="133"
          cy="50"
          r="5"
          fill="white"
          fillOpacity="0.8"
          animate={{ cx: [128, 140, 135, 128], cy: [49, 46, 55, 49] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
