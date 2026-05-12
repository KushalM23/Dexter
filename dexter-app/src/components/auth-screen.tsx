"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { DexterEyes } from "@/components/illustrations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthScreen() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("[auth] OAuth error:", authError);
        setError("We could not open your field journal. Try again.");
        setIsPending(false);
      }
    } catch (err) {
      console.error("[auth] Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Supabase is not configured. Check your env settings.",
      );
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-[#2191FB] px-8 py-12 text-white">
      {/* Content area - top */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* App name */}
        <h1
          className="text-[4rem] leading-[0.85] tracking-[-0.04em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your World
          <br />
          is Wild.
        </h1>

        {/* Tagline */}
        <p className="mt-5 max-w-[280px] text-base leading-relaxed text-white/90">
          Snap real animals, plants, and organisms. Dexter turns every sighting
          into a collectible field card.
        </p>
      </motion.div>

      {/* Illustration area - center */}
      <motion.div
        className="flex flex-1 flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        <DexterEyes size={220} />
      </motion.div>

      {/* Action section - bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 22 }}
      >
        <button
          type="button"
          onClick={handleLogin}
          disabled={isPending}
          className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[#1A1A1A] px-6 py-5 text-left text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
        >
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/50">
              Sign in with
            </div>
            <div
              className="mt-1 text-2xl leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Google
            </div>
          </div>
          <ArrowRight className="h-6 w-6" />
        </button>
        {error ? (
          <div className="mt-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-medium text-white">
            {error}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}


