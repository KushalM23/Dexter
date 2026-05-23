"use client";

import { useState } from "react";
import { Copy, PencilLine, Check, LogOut, ChevronRight, Gift, Flame, Trophy, Share, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { AvatarBadge, avatarOptions } from "@/components/ui/illustrations";
import { ProgressRail } from "@/components/ui/screen-primitives";
import { tabThemeConfig } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileData = {
  user: {
    displayName: string;
    avatarId: string;
    friendCode: string;
    totalXp: number;
    email: string;
  };
  globalRank: number | null;
  totalCards: number;
  streak: number;
  capturesThisWeek: number;
  rarestCatch: {
    collection: {
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    };
    card: {
      commonName: string;
    };
  } | null;
  breakdown: Array<{
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    count: number;
    color: string;
  }>;
};

const PROFILE_THEME = tabThemeConfig.profile;

export function ProfileScreen({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(data.user.displayName);
  const [avatarId, setAvatarId] = useState(data.user.avatarId);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const xpInLvl = data.user.totalXp % 500;
  const level = Math.floor(data.user.totalXp / 500) + 1;
  const streakProgress = data.streak % 5 || (data.streak > 0 ? 5 : 0);

  const saveProfile = async () => {
    setIsPending(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarId }),
      });
      if (!response.ok) throw new Error("Could not save your profile just yet.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile just yet.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="theme-scope pb-10 space-y-8 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 sm:pt-6">
        <div className="display-hero !text-center text-theme-accent">{data.user.displayName}</div>
      </div>

      {/* Top Section: Avatar & Action Pills */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-6">
        {/* Left: Avatar + Lvl */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative mb-4">
            <AvatarBadge avatarId={data.user.avatarId} size={100} />
          </div>
          <div className="w-full max-w-[160px]">
            <FriendCode code={data.user.friendCode} />
            <div className="text-sm font-bold text-foreground uppercase tracking-[0.15em] mb-3 scale-y-95">
              Level {level}
            </div>
            <ProgressRail 
              value={xpInLvl} 
              total={500} 
              accent="var(--theme-accent)" 
              soft="rgba(26,26,26,0.08)" 
            />
            <div className="text-[10px] font-bold text-foreground opacity-50 mt-2 uppercase tracking-widest">
              {xpInLvl} / 500 XP
            </div>
          </div>
        </div>

        {/* Right: Stack of Pills */}
        <div className="flex-1 flex flex-col justify-center gap-3 w-full max-w-sm mx-auto md:mx-0 pt-2">
          <div className="rounded-3xl bg-surface border border-black/5 px-5 py-4 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02]">
            <div className="text-[15px] font-bold text-theme-ink flex items-center gap-3">
              <Trophy className="h-5 w-5 text-theme-accent" /> Rank
            </div>
            <div className="font-display text-lg tracking-widest bg-theme-wash text-theme-accent px-3 py-1 rounded-xl">
               {data.globalRank ? `#${data.globalRank}` : "-"}
            </div>
          </div>
        </div>
      </div>


      {/* Middle Section: Breakdown Grid */}
      <div className="rounded-4xl border border-[rgba(26,26,26,0.08)] bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <div className="text-[16px] sm:text-lg font-slackey tracking-wider text-theme-ink mb-6">
          Capture Portfolio
        </div>
        <div className="flex flex-wrap justify-between gap-3 sm:gap-4">
          {data.breakdown.slice(0, 4).map((item) => (
            <div key={item.rarity} className="flex flex-col items-center gap-3 text-center flex-1">
              <div 
                className="h-[64px] w-[64px] sm:h-[76px] sm:w-[76px] rounded-full flex items-center justify-center shadow-md relative overflow-hidden" 
                style={{ backgroundColor: item.color }}
              >
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                <span className="font-display text-2xl sm:text-3xl text-white relative z-10">{item.count}</span>
              </div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-theme-ink opacity-80 truncate px-1">
                {item.rarity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="pt-2">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          type="button" 
          onClick={async () => {
            const supabase = createSupabaseBrowserClient();
            await supabase.auth.signOut();
            router.push("/auth");
            router.refresh();
          }}
          className="ghost-action w-full flex justify-center items-center gap-2"
          style={{ fontSize: "1.15rem", padding: "16px" }}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign out from Dexter</span>
        </motion.button>
      </div>
    </div>
  );
}

function FriendCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
      className="w-full flex items-start justify-between transition-transform hover:scale-[1.02]"
    >
      <div className="font-display text-sm tracking-widest bg-theme-wash text-theme-accent px-3 py-1 rounded-xl flex items-center">
        {code}
      </div>
    </motion.button>
  );
}
