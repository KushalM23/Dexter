"use client";

import { useState } from "react";
import { ArrowRight, Bird, Leaf, Sparkles } from "lucide-react";

import { DexeLogo } from "@/components/illustrations";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff5a6,_transparent_34%),linear-gradient(180deg,#fffef8_0%,#f6f3ff_52%,#eef8ff_100%)] px-5 py-10 text-[#1A1A1A]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[420px] flex-col justify-between rounded-[42px] border-[5px] border-[#1A1A1A] bg-[#fffef8] px-7 py-8 shadow-[0_24px_80px_rgba(17,17,17,0.16)]">
        <div className="space-y-6">
          <DexeLogo color="#2191FB" />
          <div className="rounded-[30px] bg-[#2191FB] px-6 py-7 text-[#FAFAFF]">
            <div className="mb-4 flex gap-3">
              <Bird className="h-6 w-6" />
              <Leaf className="h-6 w-6" />
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="font-[family:var(--font-display)] text-5xl leading-[0.9] tracking-[-0.06em]">
              Your
              <br />
              wild binder.
            </h1>
            <p className="mt-4 max-w-[240px] text-sm leading-6 text-white/85">
              Snap real animals, plants, and organisms. DexE turns every valid
              sighting into a collectible field card.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogin}
            disabled={isPending}
            className="relative z-10 flex w-full cursor-pointer items-center justify-between rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-5 py-4 text-left text-[#FAFAFF] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
                Google only
              </div>
              <div className="mt-1 font-[family:var(--font-display)] text-2xl leading-none">
                Continue with Google
              </div>
            </div>
            <ArrowRight className="h-6 w-6" />
          </button>
          {error ? (
            <p className="text-sm font-medium text-[#E40046]">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
