"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";

import { AvatarBadge, avatarOptions } from "@/components/illustrations";

export function OnboardingScreen({
  friendCode,
  initialName,
}: {
  friendCode: string;
  initialName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState("avatar-1");
  const [displayName, setDisplayName] = useState(initialName);
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleComplete = async () => {
    setIsPending(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || initialName,
          avatarId: selectedAvatar,
        }),
      });
      router.refresh();
    } catch {
      setIsPending(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#1A1A1A]">
      <AnimatePresence initial={false}>
        {step === 0 ? (
          <motion.div
          key="step-avatar"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 flex flex-col overflow-y-auto bg-[#FE5F55] px-6 pb-10 pt-14 text-white"
        >
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-[6px] flex-1 rounded-full bg-white" />
            <div className="h-[6px] flex-1 rounded-full bg-white/30" />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-white/60">
              Step 1 of 2
            </div>
            <h1
              className="text-[2.8rem] leading-[0.9] tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pick your
              <br />
              explorer icon.
            </h1>
          </motion.div>

          {/* Display name */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                Display name
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl bg-white/20 px-5 py-4 text-3xl text-white placeholder-white/40 outline-none backdrop-blur-sm focus:bg-white/25"
                style={{ fontFamily: "var(--font-display)" }}
                placeholder="Your name"
                maxLength={24}
              />
            </label>
          </motion.div>

          {/* Avatar grid */}
          <motion.div
            className="mt-6 grid grid-cols-4 gap-2.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {avatarOptions.map((avatarId) => {
              const active = avatarId === selectedAvatar;

              return (
                <motion.button
                  key={avatarId}
                  type="button"
                  onClick={() => setSelectedAvatar(avatarId)}
                  whileTap={{ scale: 0.92 }}
                  className="focus:outline-none"
                >
                  <AvatarBadge avatarId={avatarId} selected={active} size={76} />
                </motion.button>
              );
            })}
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Continue button */}
          <motion.button
            type="button"
            onClick={() => setStep(1)}
            whileTap={{ scale: 0.97 }}
            className="mt-8 flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[#1A1A1A] px-6 py-5 text-white transition-transform hover:-translate-y-0.5"
          >
            <span
              className="text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Looks good
            </span>
            <ArrowRight className="h-6 w-6" />
          </motion.button>
        </motion.div>

      ) : (
        <motion.div
          key="step-code"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 flex flex-col overflow-y-auto bg-[#1FC147] px-6 pb-10 pt-14 text-white"
        >
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-[6px] flex-1 rounded-full bg-white/30" />
            <div className="h-[6px] flex-1 rounded-full bg-white" />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-white/50">
              Step 2 of 2
            </div>
            <h1
              className="text-[2.8rem] leading-[0.9] tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Welcome to
              <br />
              Dexter.
            </h1>
          </motion.div>

          {/* Friend code card */}
          <motion.div
            className="mt-10 rounded-2xl bg-white p-6 text-[#1A1A1A] shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 250, damping: 22 }}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-black/45">
              Your friend code
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1A1A1A] px-5 py-4 text-white">
              <span
                className="text-3xl tracking-[0.2em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {friendCode}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={async () => {
                  await navigator.clipboard.writeText(friendCode);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-full bg-white/12 p-3"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-[#1FC147]" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </motion.button>
            </div>
            <p className="mt-4 text-sm leading-6 text-black/60">
              This is your unique explorer code. Share it with friends to connect later.
            </p>
            {copied ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm font-bold text-[#1FC147]"
              >
                Copied!
              </motion.p>
            ) : null}
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            <motion.button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              whileTap={{ scale: 0.97 }}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[#1A1A1A] px-6 py-5 text-white transition-transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              <span
                className="text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Start Exploring
              </span>
              <ArrowRight className="h-6 w-6" />
            </motion.button>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/20 px-5 py-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
