"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Sparkles } from "lucide-react";

import { AvatarBadge, avatarOptions } from "@/components/illustrations";

export function OnboardingScreen({
  initialName,
  friendCode,
}: {
  initialName: string;
  friendCode: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState("avatar-fox");
  const [displayName, setDisplayName] = useState(initialName);
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleComplete = async () => {
    setIsPending(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        avatarId: selectedAvatar,
      }),
    });
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffef8_0%,#f2f5ff_100%)] px-5 py-8">
      <div className="mx-auto max-w-[430px] rounded-[42px] border-[5px] border-[#1A1A1A] bg-[#FAFAFF] p-6 shadow-[0_24px_80px_rgba(17,17,17,0.15)]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-black/45">
              Explorer setup
            </div>
            <h1 className="mt-2 font-[family:var(--font-display)] text-4xl leading-none tracking-[-0.05em]">
              {step === 0 ? "Pick your explorer icon" : "Welcome to DexE"}
            </h1>
          </div>
          <div className="rounded-full bg-[#fff7bf] px-3 py-2 text-xs font-black uppercase tracking-[0.2em]">
            {step + 1}/2
          </div>
        </div>

        {step === 0 ? (
          <div>
            <div className="grid grid-cols-3 gap-4">
              {avatarOptions.map((avatarId) => {
                const active = avatarId === selectedAvatar;

                return (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarId)}
                    className="transition-transform hover:-translate-y-1"
                  >
                    <AvatarBadge avatarId={avatarId} selected={active} />
                  </button>
                );
              })}
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-black/45">
                Display name
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-[22px] border-[3px] border-[#1A1A1A] bg-white px-4 py-4 text-lg font-semibold outline-none"
                maxLength={24}
              />
            </label>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#2191FB] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
            >
              Looks good
            </button>
          </div>
        ) : (
          <div>
            <div className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-[#fff7bf] p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-black/55">
                <Sparkles className="h-4 w-4" />
                Your friend code
              </div>
              <div className="mt-4 flex items-center justify-between rounded-[22px] bg-[#1A1A1A] px-5 py-4 text-white">
                <span className="font-[family:var(--font-display)] text-4xl tracking-[0.2em]">
                  {friendCode}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(friendCode);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-full bg-white/12 p-3"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-black/70">
                This is your unique explorer code. Share it with friends to connect later.
              </p>
              {copied ? (
                <p className="mt-2 text-sm font-bold text-[#2191FB]">Copied to clipboard.</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              className="mt-6 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#1FC147] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
            >
              Start Exploring
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-3 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.22em]"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
