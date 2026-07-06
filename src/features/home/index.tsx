"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import {
  CAPTURE_TRIGGER_BUTTON_CLASS,
  CAPTURE_TRIGGER_INNER_CLASS,
  COMMON_INVALID_CAPTURE_MESSAGE,
  isFailureResult,
  SCANNING_PHRASES,
} from "@/features/home/constants";
import { HomeCaptureResult } from "@/features/home/capture-result";
import { HomeCaptureStage } from "@/features/home/capture-stage";
import { HomeIdleState } from "@/features/home/idle-state";
import type { HomeData, HomeScreenMode } from "@/features/home/types";
import type { CaptureResult, TabSlug } from "@/lib/types";
interface ZoomCapabilities {
  zoom?: {
    min: number;
    max: number;
    step: number;
  };
}

interface ZoomConstraints {
  zoom?: number;
}

export function HomeScreen({
  data,
  onTabChange,
}: {
  data: HomeData;
  onTabChange?: (slug: TabSlug) => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch((err) => {
        console.error("Failed to play camera stream in callback ref:", err);
      });
    }
  }, []);

  const [mode, setMode] = useState<HomeScreenMode>("idle");
  const [captureData, setCaptureData] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const [scanningPhraseIndex, setScanningPhraseIndex] = useState(0);
  const [zoom, setZoom] = useState<number>(1);
  const [isNativeZoomSupported, setIsNativeZoomSupported] = useState<boolean>(false);
  const [activeResolution, setActiveResolution] = useState<string>("Unknown");

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const captureFailure = isFailureResult(result) ? result : null;
  const activeCaptureMode =
    mode === "camera" || mode === "preview" || mode === "processing"
      ? mode
      : null;
  const failureMessage =
    captureFailure?.kind === "invalid"
      ? COMMON_INVALID_CAPTURE_MESSAGE
      : captureFailure?.kind === "low_confidence"
        ? "We could not confidently match this sighting. Try a steadier shot with better lighting."
        : "Something interrupted the scan. Try one more photo and we will take another look.";

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTimeout(() => {
      setIsNativeZoomSupported(false);
      setActiveResolution("Unknown");
    }, 0);
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setLocationStatus("denied");
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setTimeout(() => {
          setLocation(nextLocation);
          setLocationStatus("granted");
        }, 0);
        fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextLocation),
        })
          .then((res) => res.json())
          .then((data: { label?: string }) => {
            if (data?.label) {
              setTimeout(() => {
                setLocationLabel(data.label || null);
              }, 0);
            }
          })
          .catch(() => undefined);
      },
      () => {
        setTimeout(() => {
          setLocationStatus("denied");
        }, 0);
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).dexter_capture_active = mode !== "idle";
      
      // If we transition back to "idle" (i.e. user comes back home out of capture/result screens),
      // dispatch a custom event to instantly check for challenges.
      if (mode === "idle") {
        window.dispatchEvent(new CustomEvent("check-challenges"));
      }
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    async function startCamera() {
      const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
      
      // Define a series of resolution configurations in order of preference
      const presets = [
        // 1. Orientation-matched 4:3 native high-res (maximizes native camera sensor resolution)
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: isPortrait ? 3024 : 4032 },
            height: { ideal: isPortrait ? 4032 : 3024 }
          },
          audio: false
        },
        // 2. Orientation-matched 16:9 Full HD
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: isPortrait ? 1080 : 1920 },
            height: { ideal: isPortrait ? 1920 : 1080 }
          },
          audio: false
        },
        // 3. Generic 16:9 Full HD Landscape (common fallback)
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        // 4. Orientation-matched 4:3 HD
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: isPortrait ? 960 : 1280 },
            height: { ideal: isPortrait ? 1280 : 960 }
          },
          audio: false
        },
        // 5. Orientation-matched 16:9 HD (720p)
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: isPortrait ? 720 : 1280 },
            height: { ideal: isPortrait ? 1280 : 720 }
          },
          audio: false
        },
        // 6. Absolute Fallback: let the browser decide
        {
          video: { facingMode: { ideal: "environment" } },
          audio: false
        }
      ];

      let stream: MediaStream | null = null;

      for (let i = 0; i < presets.length; i++) {
        try {
          console.log(`[Camera] Probing resolution preset #${i + 1}...`);
          const tempStream = await navigator.mediaDevices.getUserMedia(presets[i]);
          const track = tempStream.getVideoTracks()[0];
          if (track) {
            const settings = typeof track.getSettings === "function" ? track.getSettings() : {};
            const w = settings.width || 0;
            const h = settings.height || 0;
            console.log(`[Camera] Preset #${i + 1} succeeded. Returned resolution: ${w}x${h}`);

            // Accept if it's at least 720p in either dimension OR if it is our absolute fallback preset
            if (w >= 720 || h >= 720 || i === presets.length - 1) {
              stream = tempStream;
              console.log(`[Camera] Accepted stream resolution: ${w}x${h}`);
              break;
            } else {
              console.warn(`[Camera] Preset #${i + 1} returned low resolution (${w}x${h}), discarding and trying next...`);
              tempStream.getTracks().forEach((t) => t.stop());
            }
          } else {
            tempStream.getTracks().forEach((t) => t.stop());
          }
        } catch (err) {
          console.warn(`[Camera] Preset #${i + 1} failed:`, err);
        }
      }

      if (!stream) {
        setCameraError("Camera unavailable. Check permissions and try again.");
        return;
      }

      try {
        streamRef.current = stream;
        setCameraError(null);

        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
          const settings = typeof track.getSettings === "function" ? track.getSettings() : {};
          const constraints = typeof track.getConstraints === "function" ? track.getConstraints() : {};

          console.log("[Camera Track capabilities]", capabilities);
          console.log("[Camera Track settings]", settings);
          console.log("[Camera Track constraints]", constraints);

          if (settings.width && settings.height) {
            setActiveResolution(`${settings.width}x${settings.height}`);
          } else {
            setActiveResolution("Unknown");
          }

          const supportsNative = !!(capabilities as ZoomCapabilities).zoom;
          setIsNativeZoomSupported(supportsNative);

          if (supportsNative) {
            const min = (capabilities as ZoomCapabilities).zoom?.min || 1;
            const max = (capabilities as ZoomCapabilities).zoom?.max || 10;
            const clamped = Math.max(min, Math.min(max, zoomRef.current));
            try {
              await track.applyConstraints({
                advanced: [{ zoom: clamped } as ZoomConstraints],
              } as MediaTrackConstraints);
            } catch (err) {
              console.warn("Failed to apply initial native zoom constraint:", err);
            }
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("[Camera] Error starting stream playback:", err);
        setCameraError("Camera playback failed. Please try again.");
      }
    }

    void startCamera();
    return () => stopCamera();
  }, [mode]);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !isNativeZoomSupported) return;

    const applyZoom = async () => {
      try {
        const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
        const min = (capabilities as ZoomCapabilities).zoom?.min || 1;
        const max = (capabilities as ZoomCapabilities).zoom?.max || 10;
        const clamped = Math.max(min, Math.min(max, zoom));
        await track.applyConstraints({
          advanced: [{ zoom: clamped } as ZoomConstraints],
        } as MediaTrackConstraints);
      } catch (err) {
        console.error("Failed to apply zoom constraints dynamically:", err);
      }
    };

    void applyZoom();
  }, [zoom, isNativeZoomSupported]);

  useEffect(() => {
    if (mode !== "result" || !result || captureFailure) {
      return;
    }

    const timeout = window.setTimeout(() => setRevealReady(true), 1400);
    return () => window.clearTimeout(timeout);
  }, [captureFailure, mode, result]);

  useEffect(() => {
    if (mode !== "processing") return;

    const interval = window.setInterval(() => {
      setScanningPhraseIndex(
        (current) => (current + 1) % SCANNING_PHRASES.length,
      );
    }, 1700);

    return () => window.clearInterval(interval);
  }, [mode]);

  const takeShot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const width = videoRef.current.videoWidth || 720;
    const height = videoRef.current.videoHeight || 960;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const context = canvasRef.current.getContext("2d");

    if (!context) return;

    // If native hardware zoom is supported, the stream itself is already zoomed,
    // so we capture the full frame (activeZoom = 1). Otherwise, crop digitally.
    const activeZoom = isNativeZoomSupported ? 1 : zoom;

    const sourceWidth = width / activeZoom;
    const sourceHeight = height / activeZoom;
    const sourceX = (width - sourceWidth) / 2;
    const sourceY = (height - sourceHeight) / 2;

    context.drawImage(
      videoRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );
    const next = canvasRef.current.toDataURL("image/jpeg", 0.95);
    setCaptureData(next);
    setMode("preview");
  };

  const confirmCapture = () => {
    if (!captureData) return;

    setRevealReady(false);
    setScanningPhraseIndex(0);
    setMode("processing");
    setIsPending(true);

    fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: captureData,
        ...location,
      }),
    })
      .then((response) => response.json() as Promise<CaptureResult>)
      .then((nextResult) => {
        setRevealReady(false);
        setResult(nextResult);
        setMode("result");
        setIsPending(false);
      })
      .catch(() => {
        setRevealReady(false);
        setResult({
          kind: "error",
          message: "Something went wrong. Try again.",
        });
        setMode("result");
        setIsPending(false);
      });
  };

  const resetToCamera = () => {
    setCaptureData(null);
    setResult(null);
    setRevealReady(false);
    setMode("camera");
    setZoom(1);
  };

  const returnToIdle = () => {
    setCaptureData(null);
    setResult(null);
    setRevealReady(false);
    setMode("idle");
    setZoom(1);
    router.refresh();
  };

  const closeCapture = () => {
    setCaptureData(null);
    setResult(null);
    setRevealReady(false);
    setMode("idle");
    setZoom(1);
  };

  return (
    <div className="app-shell-min relative flex flex-col">
      <AnimatePresence mode="wait">
        {mode === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <HomeIdleState
              data={data}
              locationStatus={locationStatus}
              locationLabel={locationLabel}
              onRequestLocation={requestLocation}
              onViewChallenges={() => onTabChange ? onTabChange("challenges") : router.push("/challenges")}
              onViewDexe={() => onTabChange ? onTabChange("dexe") : router.push("/dexe")}
            />
          </motion.div>
        )}

        {mode === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex h-full flex-1 flex-col px-3 pb-5 pt-2"
          >
            <HomeCaptureResult
              result={result}
              captureFailure={captureFailure}
              revealReady={revealReady}
              failureMessage={failureMessage}
              onReturnToIdle={returnToIdle}
              onResetToCamera={resetToCamera}
            />
          </motion.div>
        )}

        {activeCaptureMode && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex h-full flex-1 flex-col px-3 pb-5 pt-2"
          >
            <HomeCaptureStage
              mode={activeCaptureMode}
              captureData={captureData}
              cameraError={cameraError}
              scanningPhraseIndex={scanningPhraseIndex}
              videoRef={setVideoRef}
              isPending={isPending}
              zoom={zoom}
              onZoomChange={setZoom}
              isNativeZoomSupported={isNativeZoomSupported}
              activeResolution={activeResolution}
              onClose={closeCapture}
              onReturnHome={returnToIdle}
              onTakeShot={takeShot}
              onConfirmCapture={confirmCapture}
              onResetToCamera={resetToCamera}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && (mode === "idle" || (mode === "camera" && !cameraError)) ? createPortal(
        <div className="fixed inset-0 left-10 z-40 flex flex-col pointer-events-none sm:left-14">
          <div className="pointer-events-auto mt-auto flex w-full justify-center items-center gap-6 px-4 pb-10">
            {mode === "camera" ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={closeCapture}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-theme-accent rounded-full text-white shadow-md transition-transform"
              >
                <X className="h-5 w-5" strokeWidth={5} />
              </motion.button>
            ) : (
              <div className="h-10 w-10 shrink-0 pointer-events-none" />
            )}

            <motion.button
              key="persistent-capture-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={mode === "idle" ? () => setMode("camera") : takeShot}
              className={CAPTURE_TRIGGER_BUTTON_CLASS}
            >
              <span className={CAPTURE_TRIGGER_INNER_CLASS} />
            </motion.button>

            <div className="h-14 w-14 shrink-0 pointer-events-none" />
          </div>
        </div>,
        document.body
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
