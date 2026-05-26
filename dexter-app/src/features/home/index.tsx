"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { CaptureResult } from "@/lib/types";

export function HomeScreen({ data }: { data: HomeData }) {
  const router = useRouter();
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
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(nextLocation);
        setLocationStatus("granted");
        fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextLocation),
        })
          .then((res) => res.json())
          .then((data: { label?: string }) => {
            if (data?.label) setLocationLabel(data.label);
          })
          .catch(() => undefined);
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).dexter_capture_active = mode !== "idle";
      
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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError("Camera unavailable. Check permissions and try again.");
      }
    }

    void startCamera();
    return () => stopCamera();
  }, [mode]);

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

    context.drawImage(videoRef.current, 0, 0, width, height);
    const next = canvasRef.current.toDataURL("image/jpeg", 0.85);
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
  };

  const returnToIdle = () => {
    setCaptureData(null);
    setResult(null);
    setRevealReady(false);
    setMode("idle");
    router.refresh();
  };

  const closeCapture = () => {
    setCaptureData(null);
    setResult(null);
    setRevealReady(false);
    setMode("idle");
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
              onViewChallenges={() => router.push("/challenges")}
              onViewDexe={() => router.push("/dexe")}
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
              onClose={closeCapture}
              onReturnHome={returnToIdle}
              onTakeShot={takeShot}
              onConfirmCapture={confirmCapture}
              onResetToCamera={resetToCamera}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(mode === "idle" || (mode === "camera" && !cameraError)) ? (
        <div className="fixed inset-0 left-12 z-40 flex flex-col pointer-events-none sm:left-14">
          <div className="pointer-events-auto mt-auto flex w-full justify-center items-center gap-6 px-4 pb-10">
            {mode === "camera" ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={closeCapture}
                className="flex h-14 w-14 shrink-0 items-center justify-center bg-theme-accent rounded-full text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-transform"
              >
                <X className="h-8 w-8" strokeWidth={6} />
              </motion.button>
            ) : (
              <div className="h-14 w-14 shrink-0 pointer-events-none" />
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
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
