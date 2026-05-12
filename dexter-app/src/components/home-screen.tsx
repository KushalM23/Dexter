"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronRight, X, MapPin, Flame, Layers } from "lucide-react";

import type { CaptureFailurePayload, CaptureResult } from "@/lib/types";

type HomeData = {
  user: {
    displayName: string;
    environmentType?: string;
    totalXp?: number;
  };
  totalCards: number;
  stats: {
    streak: number;
  };
  recentCaptures: Array<{
    collection: {
      capturedAt: string;
    };
    card: {
      commonName: string;
      scientificName: string;
      photoUrl: string;
    };
  }>;
};

const FUN_FACTS = [
  "Did you know that octopuses have three hearts?",
  "Did you know that honey never ever spoils?",
  "Did you know that a flock of crows is a murder?",
  "Did you know that elephants cannot jump?",
  "Did you know that cows have best friends?",
];

function isFailureResult(
  value: CaptureResult | null,
): value is CaptureFailurePayload {
  return (
    value?.kind === "low_confidence" ||
    value?.kind === "invalid" ||
    value?.kind === "error"
  );
}

export function HomeScreen({ data }: { data: HomeData }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<
    "idle" | "camera" | "preview" | "processing" | "result"
  >("idle");
  const [captureData, setCaptureData] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [isPending, setIsPending] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(nextLocation);
        fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextLocation),
        }).catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 3000 },
    );
  }, []);

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
        setCameraError("Camera unavailable.");
      }
    }

    void startCamera();
    return () => stopCamera();
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
        setResult(nextResult);
        setMode("result");
        setIsPending(false);
      })
      .catch(() => {
        setResult({
          kind: "error",
          message: "Error.",
        });
        setMode("result");
        setIsPending(false);
      });
  };

  const resetCapture = () => {
    setCaptureData(null);
    setResult(null);
    setMode("camera");
  };

  const captureFailure = isFailureResult(result) ? result : null;

  const firstName = data.user.displayName.split(" ")[0] || "Explorer";
  const xpTillNext = 1000 - ((data.user.totalXp || 0) % 1000);
  const habitat = data.user.environmentType || "Urban";
  const funFact = FUN_FACTS[data.totalCards % FUN_FACTS.length];

  const getRarityAnimation = (rarity: string) => {
    switch (rarity) {
      case "legendary": return { y: [0, -20, 0], scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity } };
      case "epic": return { y: [0, -10, 0], transition: { duration: 2, repeat: Infinity } };
      case "rare": return { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity } };
      default: return { opacity: [0, 1], y: [20, 0], transition: { duration: 0.5 } };
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100dvh-180px)] relative">
      <AnimatePresence mode="wait">
        {mode === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Image src="/icon.svg" width={42} height={42} alt="App Logo" className="drop-shadow-sm" />
              <div className="flex flex-col">
                <h1 className="text-[32px] text-[#1A1A1A] leading-none tracking-wide mt-1" style={{ fontFamily: "var(--font-display)" }}>
                  Hey {firstName}
                </h1>
                <p className="text-xs text-[#1A1A1A]/50 font-bold tracking-wide">
                  Ready to explore?
                </p>
              </div>
            </div>

            {/* Middle Section: XP & Habitat */}
            <div className="mt-8 flex items-center justify-between">
              <div>
                <div className="text-[#1A1A1A] font-bold text-sm">
                  <span className="text-[#2191FB] text-2xl mr-1" style={{ fontFamily: "var(--font-display)" }}>{xpTillNext}</span>XP till next level
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#2191FB]/10 px-3 py-1.5 rounded-full text-xs font-bold capitalize text-[#2191FB]">
                <MapPin className="h-3.5 w-3.5" />
                {habitat}
              </div>
            </div>

            {/* Two Small Cards */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} className="relative bg-gradient-to-br from-[#2191FB] to-[#1b7edb] rounded-[24px] p-5 flex flex-col justify-between overflow-hidden shadow-sm h-[110px]">
                <Flame className="absolute -right-4 -bottom-4 h-24 w-24 text-white opacity-10" />
                <div className="flex justify-between items-start z-10">
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Streak</span>
                  <Flame className="h-4 w-4 text-white/80" />
                </div>
                <div className="mt-auto z-10">
                  <span className="text-white text-4xl leading-none" style={{ fontFamily: "var(--font-display)" }}>{data.stats.streak}</span>
                  <span className="text-white/80 text-xs font-bold ml-1">Days</span>
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="relative bg-gradient-to-br from-[#2191FB] to-[#1b7edb] rounded-[24px] p-5 flex flex-col justify-between overflow-hidden shadow-sm h-[110px]">
                <Layers className="absolute -right-4 -bottom-4 h-24 w-24 text-white opacity-10" />
                <div className="flex justify-between items-start z-10">
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Cards</span>
                  <Layers className="h-4 w-4 text-white/80" />
                </div>
                <div className="mt-auto z-10">
                  <span className="text-white text-4xl leading-none" style={{ fontFamily: "var(--font-display)" }}>{data.totalCards}</span>
                  <span className="text-white/80 text-xs font-bold ml-1">Found</span>
                </div>
              </motion.div>
            </div>

            {/* Recent Captures */}
            <div className="mt-8 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-bold text-[#1A1A1A] text-lg">Recent Captures</h2>
                <button onClick={() => router.push('/dexe')} className="text-[#2191FB] text-sm font-bold flex items-center gap-1">
                  See all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-4">
                {data.recentCaptures.slice(0, 2).map((entry) => (
                  <motion.div whileHover={{ scale: 1.02 }} key={entry.collection.capturedAt} className="flex-1 aspect-[3/4] max-h-[220px] rounded-[24px] bg-white border border-black/5 p-4 flex flex-col relative overflow-hidden shadow-sm">
                    {entry.card.photoUrl && (
                      <img src={entry.card.photoUrl} className="absolute inset-0 w-full h-full object-cover opacity-15 grayscale" />
                    )}
                    <div className="relative z-10 flex-1 flex flex-col justify-end">
                       <div className="font-bold text-[#1A1A1A] text-[18px] leading-tight line-clamp-2" style={{ fontFamily: "var(--font-display)" }}>{entry.card.commonName}</div>
                    </div>
                  </motion.div>
                ))}
                {data.recentCaptures.length === 0 && (
                  <div className="w-full text-center py-10 text-sm text-black/40 font-bold bg-black/5 rounded-[24px]">No captures yet.</div>
                )}
              </div>
            </div>

            {/* Fun Fact */}
            <div className="mt-6 mb-4">
              <p className="text-[13px] italic text-[#1A1A1A]/40 font-bold text-center">
                "{funFact}"
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col flex-1 relative rounded-[32px] overflow-hidden bg-[#1A1A1A] shadow-2xl"
          >
            {mode === "camera" && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setMode("idle"); setCaptureData(null); setResult(null); }}
                  className="absolute top-4 left-4 z-20 h-10 w-10 bg-black/40 backdrop-blur rounded-full flex justify-center items-center text-white"
                >
                  <X className="h-5 w-5" />
                </motion.button>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-medium text-white">
                    {cameraError}
                  </div>
                )}
              </>
            )}

            {(mode === "preview" || mode === "processing") && (
              <>
                <Image
                  src={captureData ?? ""}
                  alt="Preview"
                  fill
                  unoptimized
                  className={`object-cover transition-all duration-500 ${mode === "processing" ? "blur-xl brightness-50" : ""}`}
                />
                {mode === "processing" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-3">
                      <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute bottom-8 left-0 right-0 px-6 flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={resetCapture}
                      className="flex-1 h-14 bg-white text-[#1A1A1A] text-xl tracking-wide rounded-full shadow-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Retry
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmCapture}
                      disabled={isPending}
                      className="flex-1 h-14 bg-[#2191FB] text-white text-xl tracking-wide rounded-full shadow-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Confirm
                    </motion.button>
                  </div>
                )}
              </>
            )}

            {mode === "result" && result && (
              <div className="absolute inset-0 bg-[#FAFAFF] flex flex-col items-center justify-center px-6">
                {result.kind === "new" || result.kind === "duplicate" ? (
                  <>
                    <div 
                      className="w-full max-w-[280px] aspect-[3/4] relative cursor-pointer"
                      style={{ perspective: 1000 }}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <motion.div 
                        className="w-full h-full relative"
                        animate={{ rotateY: isFlipped ? 180 : 0, ...getRarityAnimation(result.card.rarity) }}
                        transition={{ rotateY: { duration: 0.6, type: "spring", stiffness: 260, damping: 20 } }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Front */}
                        <div className="absolute inset-0 bg-white rounded-[24px] p-6 flex flex-col border border-black/5 shadow-xl" style={{ backfaceVisibility: "hidden" }}>
                          <div className="h-32 w-full rounded-[16px] bg-black/5 overflow-hidden mb-4 relative">
                            {result.card.photoUrl && <img src={result.card.photoUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div className="text-[10px] font-bold text-[#2191FB] uppercase tracking-widest mb-2">{result.card.rarity}</div>
                          <div className="text-2xl font-bold text-[#1A1A1A] leading-tight" style={{ fontFamily: "var(--font-display)" }}>{result.card.commonName}</div>
                          <div className="text-xs font-medium text-black/50 italic mt-1 line-clamp-1">{result.card.scientificName}</div>
                          <div className="mt-auto pt-3 flex justify-between items-center border-t border-black/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">XP Value</span>
                            <span className="text-sm font-bold text-[#2191FB]">+{result.xpAwarded}</span>
                          </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 bg-[#2191FB] rounded-[24px] p-6 flex flex-col text-white shadow-xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                          <div className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>Taxonomy</div>
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between"><span className="opacity-70">Kingdom</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.kingdom}</span></div>
                            <div className="flex justify-between"><span className="opacity-70">Phylum</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.phylum}</span></div>
                            <div className="flex justify-between"><span className="opacity-70">Class</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.className}</span></div>
                            <div className="flex justify-between"><span className="opacity-70">Order</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.order}</span></div>
                            <div className="flex justify-between"><span className="opacity-70">Family</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.family}</span></div>
                            <div className="flex justify-between"><span className="opacity-70">Genus</span><span className="font-bold truncate max-w-[100px] text-right">{result.card.genus}</span></div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setMode("idle");
                        setCaptureData(null);
                        setResult(null);
                        setIsFlipped(false);
                        router.refresh();
                      }} 
                      className="mt-8 h-14 w-full max-w-[280px] bg-[#2191FB] text-white text-xl tracking-wide rounded-full shadow-lg shadow-[#2191FB]/20"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Capture
                    </motion.button>
                  </>
                ) : captureFailure ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 text-4xl text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>
                      {captureFailure.kind === "low_confidence" ? "Missed" : "Error"}
                    </div>
                    <p className="text-black/60 text-sm font-medium px-6 max-w-[280px]">
                      {captureFailure.message}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={resetCapture}
                      className="mt-8 h-12 px-8 rounded-full bg-[#1A1A1A] text-lg tracking-wide text-white shadow-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Try Again
                    </motion.button>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Capture Button (Always rendered) */}
      {(mode === "idle" || mode === "camera") && (
        <div className="fixed bottom-6 left-[48px] sm:left-[56px] right-0 flex justify-center z-40 pointer-events-none">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={mode === "idle" ? () => setMode("camera") : takeShot} 
            className="pointer-events-auto h-[80px] w-[80px] bg-[#2191FB] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#2191FB]/30 border-4 border-[#FAFAFF]"
          >
            {mode === "idle" ? (
              <Camera className="h-8 w-8" />
            ) : (
              <div className="h-[52px] w-[52px] bg-white rounded-full" />
            )}
          </motion.button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
