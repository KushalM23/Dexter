"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CircleX,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

import { SpeciesCard } from "@/components/species-card";
import type { CaptureFailurePayload, CaptureResult } from "@/lib/types";

const progressMessages = [
  "Scanning the wild...",
  "Consulting the field guide...",
  "Preparing your catch...",
];

type HomeData = {
  user: {
    displayName: string;
  };
  todayLabel: string;
  totalCards: number;
  stats: {
    weeklyXp: number;
    capturesToday: number;
    streak: number;
  };
  recentCaptures: Array<{
    collection: {
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
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
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
      xpValue: number;
      lore: string;
      occurrenceCount: number;
    };
  }>;
  activeChallenge: {
    title: string;
    description: string;
    xpReward: number;
    progress: number;
    targetCount: number;
    expiresLabel: string;
  } | null;
};

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
  const [mode, setMode] = useState<
    "idle" | "camera" | "preview" | "processing" | "result"
  >("idle");
  const [captureData, setCaptureData] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [isPending, setIsPending] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

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
    if (mode !== "processing") {
      return;
    }

    const timer = window.setInterval(() => {
      setProgressIndex((current) => (current + 1) % progressMessages.length);
    }, 1100);

    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });
        streamRef.current = stream;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError(
          "Camera unavailable in this browser. Check permissions and try again.",
        );
      }
    }

    void startCamera();

    return () => stopCamera();
  }, [mode]);

  const takeShot = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const width = videoRef.current.videoWidth || 720;
    const height = videoRef.current.videoHeight || 960;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const context = canvasRef.current.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(videoRef.current, 0, 0, width, height);
    const next = canvasRef.current.toDataURL("image/jpeg", 0.85);
    setCaptureData(next);
    setMode("preview");
  };

  const confirmCapture = () => {
    if (!captureData) {
      return;
    }

    setMode("processing");
    setProgressIndex(0);

    setIsPending(true);

    fetch("/api/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
        router.refresh();
      })
      .catch(() => {
        setResult({
          kind: "error",
          message: "Something went wrong. Try again.",
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

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {mode === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-[#FFF7BF] p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-black/45">
                {data.todayLabel}
              </div>
              <h2 className="mt-3 font-[family:var(--font-display)] text-5xl leading-[0.9] tracking-[-0.06em]">
                Hey,
                <br />
                {data.user.displayName.split(" ")[0]}.
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/65">
                {data.totalCards} cards logged. The binder is ready for the next
                wild find.
              </p>
            </section>

            <section className="grid grid-cols-3 gap-3">
              <StatBlock
                icon={<Sparkles className="h-5 w-5" />}
                label="XP this week"
                value={`${data.stats.weeklyXp}`}
                tint="#2191FB"
              />
              <StatBlock
                icon={<Camera className="h-5 w-5" />}
                label="Captures today"
                value={`${data.stats.capturesToday}`}
                tint="#FE5F55"
              />
              <StatBlock
                icon={<Flame className="h-5 w-5" />}
                label="Current streak"
                value={`${data.stats.streak}d`}
                tint="#1FC147"
              />
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-[family:var(--font-display)] text-2xl leading-none">
                  Recent captures
                </h3>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-black/40">
                  Last three
                </span>
              </div>
              {data.recentCaptures.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {data.recentCaptures.map((entry) => (
                    <div
                      key={`${entry.card.commonName}-${entry.collection.capturedAt}`}
                      className="min-w-[210px]"
                    >
                      <SpeciesCard
                        compact
                        commonName={entry.card.commonName}
                        scientificName={entry.card.scientificName}
                        kingdom={entry.card.kingdom}
                        phylum={entry.card.phylum}
                        className={entry.card.className}
                        order={entry.card.order}
                        family={entry.card.family}
                        genus={entry.card.genus}
                        species={entry.card.species}
                        rarity={entry.collection.rarity}
                        xpValue={entry.collection.xpAwarded}
                        lore={entry.card.lore}
                        occurrenceCount={entry.card.occurrenceCount}
                        locationLabel={entry.collection.captureLocationLabel}
                        capturedAt={entry.collection.capturedAt}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border-[3px] border-dashed border-black/18 bg-white px-5 py-8 text-sm leading-6 text-black/55">
                  No captures yet. Your first successful sighting will land
                  here.
                </div>
              )}
            </section>

            {data.activeChallenge ? (
              <section className="rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#EAF9ED] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-black/45">
                      Active challenge
                    </div>
                    <h3 className="mt-2 font-[family:var(--font-display)] text-2xl leading-none">
                      {data.activeChallenge.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-[#1FC147] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                    {data.activeChallenge.xpReward} XP
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-black/65">
                  {data.activeChallenge.description}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#1FC147]"
                    style={{
                      width: `${(data.activeChallenge.progress / data.activeChallenge.targetCount) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.22em] text-black/45">
                  <span>
                    {data.activeChallenge.progress}/
                    {data.activeChallenge.targetCount}
                  </span>
                  <span>{data.activeChallenge.expiresLabel} left</span>
                </div>
              </section>
            ) : null}

            <button
              type="button"
              onClick={() => setMode("camera")}
              className="sticky bottom-0 flex w-full items-center justify-center gap-3 rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#E1BC29] px-5 py-5 font-[family:var(--font-display)] text-3xl text-[#1A1A1A] shadow-[0_14px_30px_rgba(0,0,0,0.12)]"
            >
              <Camera className="h-7 w-7" />
              Capture
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode("idle");
                  setCaptureData(null);
                  setResult(null);
                }}
                className="rounded-full border-[3px] border-[#1A1A1A] bg-white p-3"
              >
                <CircleX className="h-5 w-5" />
              </button>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-black/40">
                Field camera
              </div>
            </div>

            <div className="overflow-hidden rounded-[34px] border-[4px] border-[#1A1A1A] bg-[#1A1A1A]">
              {mode === "camera" ? (
                <div className="relative aspect-[3/4] bg-black">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                  />
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-semibold text-white/75">
                      {cameraError}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={captureData ?? ""}
                    alt="Capture preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {mode === "camera" ? (
              <>
                <button
                  type="button"
                  onClick={takeShot}
                  className="flex w-full items-center justify-center gap-3 rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#E1BC29] px-5 py-5 font-[family:var(--font-display)] text-3xl"
                >
                  <Camera className="h-7 w-7" />
                  Snap
                </button>
              </>
            ) : null}

            {mode === "preview" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetCapture}
                  className="flex items-center justify-center gap-2 rounded-[24px] border-[3px] border-[#1A1A1A] bg-white px-4 py-4 font-black uppercase tracking-[0.18em]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={confirmCapture}
                  disabled={isPending}
                  className="rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#E1BC29] px-4 py-4 font-[family:var(--font-display)] text-2xl"
                >
                  Confirm
                </button>
              </div>
            ) : null}

            {mode === "processing" ? (
              <div className="rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#FFF7BF] px-5 py-5">
                <div className="h-3 overflow-hidden rounded-full bg-black/10">
                  <motion.div
                    animate={{ width: ["25%", "63%", "91%"] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="h-full rounded-full bg-[#2191FB]"
                  />
                </div>
                <div className="mt-3 text-sm font-semibold text-black/65">
                  {progressMessages[progressIndex]}
                </div>
              </div>
            ) : null}

            {mode === "result" && result ? (
              <div className="space-y-4">
                {result.kind === "new" || result.kind === "duplicate" ? (
                  <>
                    <SpeciesCard
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
                      lore={result.card.lore}
                      occurrenceCount={result.card.occurrenceCount}
                      locationLabel={result.collection?.captureLocationLabel}
                      capturedAt={result.collection?.capturedAt}
                      disabled={result.kind === "duplicate"}
                    />
                    <div className="rounded-[28px] border-[3px] border-[#1A1A1A] bg-white p-5">
                      <div className="font-[family:var(--font-display)] text-3xl leading-none">
                        {result.kind === "new"
                          ? `+${result.xpAwarded} XP added`
                          : "Already in your DexE"}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-black/65">
                        {result.kind === "new"
                          ? "Fresh catch confirmed. This species is now part of your collection."
                          : "You already logged this species, so no extra XP was awarded this time."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("idle");
                        setCaptureData(null);
                        setResult(null);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
                    >
                      <Trophy className="h-5 w-5" />
                      {result.kind === "new" ? "Add to DexE" : "Back"}
                    </button>
                  </>
                ) : captureFailure ? (
                  <div className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-white px-5 py-8">
                    <div className="font-[family:var(--font-display)] text-4xl leading-none">
                      {captureFailure.kind === "low_confidence"
                        ? "Couldn't identify this one."
                        : "Try again."}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-black/65">
                      {captureFailure.message}
                    </p>
                    <button
                      type="button"
                      onClick={resetCapture}
                      className="mt-6 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#FE5F55] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
                    >
                      Try Again
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="rounded-[26px] border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[0_14px_24px_rgba(26,26,26,0.08)]">
      <div
        className="mb-3 inline-flex rounded-full p-2"
        style={{ backgroundColor: `${tint}20`, color: tint }}
      >
        {icon}
      </div>
      <div className="text-xs font-black uppercase tracking-[0.22em] text-black/40">
        {label}
      </div>
      <div className="mt-2 font-[family:var(--font-display)] text-3xl leading-none">
        {value}
      </div>
    </div>
  );
}
