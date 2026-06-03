"use client";

import { useState, useEffect } from "react";
import { Copy, PencilLine, Check, LogOut, Trophy, Target, Flame, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { AvatarBadge, avatarOptions, DexterEyes } from "@/components/ui/illustrations";
import { ProgressRail } from "@/components/ui/screen-primitives";
import { tabThemeConfig, rarityColors } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PRIMARY_ACTION_BUTTON_CLASS } from "../home/constants";

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
      xpAwarded: number;
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarSize, setAvatarSize] = useState(62);

  useEffect(() => {
    const handleResize = () => {
      setAvatarSize(window.innerWidth < 380 ? 44 : 62);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const xpInLvl = data.user.totalXp % 500;
  const level = Math.floor(data.user.totalXp / 500) + 1;

  const saveProfile = () => {
    setEditing(false);
    setIsSaving(true);
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarId }),
    })
      .then((response) => {
        if (response.ok) {
          router.refresh();
        } else {
          console.error("Failed to save profile in background.");
        }
      })
      .catch((err) => {
        console.error("Error saving profile in background:", err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const maxCount = Math.max(...data.breakdown.map((b) => b.count), 1);

  return (
    <div className="relative min-h-[100dvh]">
      {/* Floating Edit/Save button */}
      <button
        onClick={() => {
          if (editing) {
            saveProfile();
          } else {
            setEditing(true);
          }
        }}
        disabled={isSaving}
        className="absolute top-10 right-4 sm:right-6 p-3 rounded-full shadow-sm hover:scale-105 transition-all z-[60] flex items-center justify-center disabled:pointer-events-none"
        style={{
          backgroundColor: editing ? "#FFFFFF" : "var(--theme-accent)",
          color: editing ? "var(--theme-accent)" : "#FFFFFF",
          backdropFilter: editing ? "blur(4px)" : "none",
        }}
      >
        {isSaving ? (
          <MicroEyeLoader />
        ) : editing ? (
          <Check className="w-5 h-5" style={{ strokeWidth: 6 }} />
        ) : (
         <PencilLine className="w-5 h-5" style={{ strokeWidth: 3 }} />
        )}
      </button>

      <div className="theme-scope pb-10 space-y-8 px-2 sm:px-4">
        {/* Top Section */}
        <div className="relative flex flex-col items-center pt-8">
          <div className="relative mb-3">
            <AvatarBadge avatarId={data.user.avatarId} size={100} />
          </div>
          <div className="display-hero !text-center text-theme-accent mb-2">{data.user.displayName}</div>
          
          <FriendCode code={data.user.friendCode} />
          
          <div className="w-full max-w-[240px] mt-3">
            <div className="flex justify-between items-end mb-2">
              <div className="text-sm font-slackey text-theme-accent uppercase tracking-widest">Level {level}</div>
              <div className="text-xs font-bold text-theme-ink opacity-60 uppercase tracking-widest">{xpInLvl} / 500 XP</div>
            </div>
            <ProgressRail 
              value={xpInLvl} 
              total={500} 
              accent="var(--theme-accent)" 
              soft="rgba(26,26,26,0.08)" 
            />
          </div>
        </div>

        {/* 3-Column Stats Card */}
        <div className="rounded-3xl bg-theme-accent mt-12 p-4 shadow-md text-white grid grid-cols-3 divide-x divide-white/20">
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-2xl font-display">{data.globalRank ? `#${data.globalRank}` : "-"}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80 text-center mt-1">Global<br/>Rank</div>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-2xl font-display">{data.totalCards}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80 text-center mt-1">Cards<br/>Collected</div>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-2xl font-display">{data.streak}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80 text-center mt-1">Best<br/>Streak</div>
          </div>
        </div>

        {/* Rarest Find */}
        {data.rarestCatch && (
          <div className="flex flex-col">
            {/* Subtle Top Divider */}
            <div className="h-[1px] w-full bg-theme-ink/30" />
            
            <div className="px-4 flex flex-col py-5">
              <div className="text-sm font-slackey text-left uppercase tracking-[0.15em] text-theme-ink opacity-50 mb-2">
                Rarest Find
              </div>
              
              <div className="flex items-center justify-between w-full pt-1 gap-3">
                {/* Left Side: Species Details */}
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="font-display text-3xl sm:text-3xl text-theme-accent leading-tight truncate">
                    {data.rarestCatch.card.commonName}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-theme-ink/40 mt-1">
                    Species
                  </span>
                </div>
                
                {/* Right Side: Rarity & XP */}
                <div className="flex flex-col items-end shrink-0 text-right ml-2">
                  <span 
                    className="font-slackey text-sm sm:text-base tracking-wider uppercase leading-none" 
                    style={{ color: rarityColors[data.rarestCatch.collection.rarity] || PROFILE_THEME.accent }}
                  >
                    {data.rarestCatch.collection.rarity}
                  </span>
                  <span className="font-display text-xs sm:text-sm text-theme-ink/60 tracking-wider mt-1.5">
                    +{data.rarestCatch.collection.xpAwarded} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Bottom Divider */}
            <div className="h-[1px] w-full bg-theme-ink/30" />
          </div>
        )}

        {/* Captures by Rarity Graph */}
        <div className="pt-2 px-4 pb-4">
          <div className="text-xl font-slackey text-left uppercase tracking-[0.15em] text-theme-accent mb-2">
            Rarity
          </div>
          <div className="space-y-6">
            {data.breakdown.map((item) => {
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.rarity} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span 
                      className="text-xs font-slackey tracking-[0.12em] uppercase"
                      style={{ color: item.color }}
                    >
                      {item.rarity}
                    </span>
                    <span className="font-display text-lg pr-4 text-theme-accent">
                      {item.count}
                    </span>
                  </div>
                  
                  {/* Elegant standard progress rail */}
                  <div 
                    className="h-3 overflow-hidden rounded-full border border-border-subtle bg-black/[0.04]"
                  >
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${percentage}%` }} 
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="h-full rounded-full" 
                      style={{ backgroundColor: item.color }} 
                    />
                  </div>
                </div>
              );
            })}
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
            className={`${PRIMARY_ACTION_BUTTON_CLASS} shadow-md w-full flex justify-center items-center gap-2`}
            style={{ fontSize: "1.15rem", padding: "16px" }}
          >
            <LogOut className="text-white h-5 w-5" />
            <span className="font-bold uppercase text-white">Sign out</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ clipPath: "circle(0px at calc(100% - 42px) 94px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 42px) 94px)" }}
            exit={{ clipPath: "circle(0px at calc(100% - 42px) 94px)" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
            className="fixed inset-y-0 left-10 right-0 sm:left-14 z-50 flex flex-col overflow-y-auto overflow-x-hidden px-6 pb-12 pt-20 text-white"
            style={{ backgroundColor: PROFILE_THEME.accent }}
          >
            <div className="mt-12 w-full max-w-md flex flex-col">
              {/* Header / Title */}
              <motion.div>
                <h1
                  className="display-title tracking-[0.03em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Edit your
                  <br />
                  Dextor profile.
                </h1>
              </motion.div>

              {/* Display name */}
              <motion.div className="mt-12 mb-12 sm:mt-16">
                <label className="block">
                  <span className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-white/80">
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
              
                  <span className="block text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                    Avatar
                  </span>
              <motion.div className="mt-4 sm:mt-12 grid grid-cols-4 gap-2.5 sm:gap-4.5 justify-items-center">
                {avatarOptions.map((optId) => {
                  const active = optId === avatarId;
                  return (
                    <motion.button
                      key={optId}
                      type="button"
                      onClick={() => setAvatarId(optId)}
                      whileTap={{ scale: 0.92 }}
                      className="focus:outline-none"
                    >
                      <AvatarBadge avatarId={optId} selected={active} size={avatarSize} />
                    </motion.button>
                  );
                })}
              </motion.div>

              {error && (
                <div className="mt-6 text-center text-sm font-bold text-white/80">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FriendCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-0">
      <div className="font-display text-sm tracking-widest text-theme-ink/70 px-0.5 py-1.5 flex items-center">
        {code}
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
        className="p-1.5 text-theme-ink/70 rounded-xl hover:scale-105 transition-transform"
      >
        {copied ? <Check className="w-4 h-4" style={{ strokeWidth: 4 }} /> : <Copy className="w-4 h-4" style={{ strokeWidth: 4 }} />}
      </motion.button>
    </div>
  );
}

function MicroEyeLoader() {
  return (
    <div className="flex items-center justify-center p-0 w-5 h-5">
      <svg viewBox="0 0 200 120" className="h-full w-full flex shrink-0" aria-hidden="true">
        <ellipse
          cx="62"
          cy="60"
          rx="42"
          ry="44"
          fill="white"
          stroke="var(--border-strong)"
          strokeWidth="6"
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
          strokeWidth="6"
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
