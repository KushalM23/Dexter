"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { AvatarBadge, DexterEyes } from "@/components/ui/illustrations";
import { tabThemeConfig } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

type LeaderboardRow = {
  rank: number;
  xp: number;
  topRarity: Rarity | null;
  user: {
    id: string;
    displayName: string;
    avatarId: string;
    friendCode: string;
  };
};

export function LeaderboardScreen({
  weekly,
  monthly,
  allTime,
  currentUserId,
}: {
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
  allTime: LeaderboardRow[];
  currentUserId: string;
}) {
  const [scope, setScope] = useState<"weekly" | "monthly" | "all-time">("all-time");

  const rows = useMemo(() => {
    return scope === "weekly" ? weekly : scope === "monthly" ? monthly : allTime;
  }, [scope, weekly, monthly, allTime]);

  const currentUser = useMemo(() => {
    return rows.find((row) => row.user.id === currentUserId) ?? null;
  }, [currentUserId, rows]);

  const podium = useMemo(() => {
    return rows.slice(0, 3);
  }, [rows]);

  const listRows = useMemo(() => {
    return rows;
  }, [rows]);

  const aheadUser = useMemo(() => {
    if (!currentUser) return null;
    return rows.find((r) => r.rank === currentUser.rank - 1) ?? null;
  }, [currentUser, rows]);

  // Framer motion list stagger variants
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.015,
        staggerDirection: -1, // Stagger backwards on exit for extra polish
      },
    },
  };

  const listRowVariants = {
    hidden: { y: 10, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 320,
        damping: 26,
      },
    },
    exit: {
      y: -8,
      opacity: 0,
      transition: {
        duration: 0.12,
      },
    },
  };

  // Stepped Bar-Graph Podium Column
  const renderPodiumBar = (row: LeaderboardRow, rank: 1 | 2 | 3) => {
    const isSelf = row.user.id === currentUserId;
    const level = Math.floor(row.xp / 500) + 1;

    // Stepped heights for the bar graphs
    const heightClasses = {
      1: "h-36 sm:h-40",
      2: "h-28 sm:h-32",
      3: "h-20 sm:h-24",
    };

    const bgStyles = {
      1: { backgroundColor: "var(--theme-accent)" },
      2: { backgroundColor: "color-mix(in srgb, var(--theme-accent) 80%, transparent)" },
      3: { backgroundColor: "color-mix(in srgb, var(--theme-accent) 60%, transparent)" },
    };

    const textColors = {
      1: "text-[var(--theme-ink)]",
      2: "text-[var(--theme-ink)]",
      3: "text-white",
    };

    const clipPaths = {
      1: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
      2: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)",
      3: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
    };

    const overlapClasses = {
      1: "z-20 w-full max-w-[135px] sm:max-w-[145px]",
      2: "z-10 w-full max-w-[105px] sm:max-w-[115px] -mr-5 sm:-mr-6",
      3: "z-10 w-full max-w-[105px] sm:max-w-[115px] -ml-5 sm:-ml-6",
    };

    return (
      <div
        className={`flex flex-col items-center justify-end ${overlapClasses[rank]}`}
        key={rank}
      >
        {/* Wrapper to preserve Tailwind's horizontal layout translate transforms against Framer Motion overrides */}
        <div className={rank === 2 ? "-translate-x-5 sm:-translate-x-6" : rank === 3 ? "translate-x-5 sm:translate-x-6" : ""}>
          {/* Reserve a stable layout container slot for avatars to overlap smoothly without shifting */}
          <div className="h-[96px] sm:h-[110px] w-[85px] sm:w-[100px] relative flex flex-col items-center justify-end">
            <AnimatePresence mode="wait">
              {/* Avatar & Info Stack (Spring-pop slide up on top inside the reserved slot) */}
              <motion.div
                key={row.user.id}
                initial={{ y: 15, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -15, opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center w-full px-1 mb-2"
              >
                {/* Perfect circular avatar container with border and soft drop shadow */}
                <div className={`rounded-full overflow-hidden border-2 shadow-sm bg-surface transition-transform duration-200 ${
                  isSelf ? "border-theme-accent ring-2 ring-theme-accent ring-offset-1 scale-105" : "border-black"
                }`}>
                  <AvatarBadge avatarId={row.user.avatarId} size={rank === 1 ? 52 : 44} />
                </div>

                {/* User Name */}
                <div className="w-full mt-2 text-[1rem] sm:text-[11px] font-display uppercase tracking-wider text-black leading-tight text-center break-words max-w-[85px] sm:max-w-[100px] mx-auto min-h-[24px] flex items-center justify-center">
                  {row.user.displayName}
                </div>
                <div className={`text-[0.8rem] sm:text-[0.5rem] font-black font-sans mt-1 leading-none text-theme-accent`}>
                  Level {level}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sloped Podium Bar (Solid physical structure - 100% static to prevent layout shifting) */}
        <div
          style={{
            ...bgStyles[rank],
            clipPath: clipPaths[rank],
          }}
          className={`w-full ${heightClasses[rank]} py-3.5 px-2 flex flex-col items-center justify-between text-center relative shadow-[0_6px_16px_rgba(0,0,0,0.06)]`}
        >
          {/* Top highlight sliver */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-white/25 z-25" />
          <div className="absolute inset-0 texture-overlay opacity-[0.015] pointer-events-none" />

          {/* 1. Circle Rank Badge at the Top Inside */}
          <div className="z-10 flex flex-col items-center justify-center leading-none text-black">
            <div className="font-display text-base sm:text-lg">#{rank}</div>
            
            {/* Smooth micro-transition slot for XP updates in-place */}
            <div className="h-[18px] relative flex items-center justify-center mt-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={row.xp}
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -4, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="text-xs font-black sm:text-sm whitespace-nowrap"
                >
                  {row.xp} XP
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Spacer at the bottom to match the clip path height */}
          <div className="h-2 w-full" />
        </div>
      </div>
    );
  };

  // Dashed Bar Placeholder for empty columns
  const renderPodiumPlaceholder = (rank: 1 | 2 | 3) => {
    const heightClasses = {
      1: "h-36 sm:h-40",
      2: "h-28 sm:h-32",
      3: "h-20 sm:h-24",
    };

    const clipPaths = {
      1: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
      2: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)",
      3: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
    };

    const overlapClasses = {
      1: "z-20 w-full max-w-[135px] sm:max-w-[145px]",
      2: "z-10 w-full max-w-[105px] sm:max-w-[115px] -mr-5 sm:-mr-6",
      3: "z-10 w-full max-w-[105px] sm:max-w-[115px] -ml-5 sm:-ml-6",
    };

    return (
      <div className={`flex flex-col items-center justify-end ${overlapClasses[rank]} opacity-35 select-none`} key={rank}>
        {/* Wrapper to preserve Tailwind's horizontal layout translate transforms against Framer Motion overrides */}
        <div className={rank === 2 ? "-translate-x-5 sm:-translate-x-6" : rank === 3 ? "translate-x-5 sm:translate-x-6" : ""}>
          {/* Reserve a stable layout container slot for placeholders to overlap smoothly without shifting */}
          <div className="h-[96px] sm:h-[110px] w-[85px] sm:w-[100px] relative flex flex-col items-center justify-end">
            <AnimatePresence mode="wait">
              {/* Placeholder avatar slot (Spring-pop slide up on top inside the reserved slot) */}
              <motion.div
                key={`placeholder-${rank}`}
                initial={{ y: 15, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -15, opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end w-full px-1 mb-3"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-border-strong bg-surface-soft flex items-center justify-center">
                  <span className="text-[10px] font-black text-ink-soft">?</span>
                </div>
                <div className="w-full mt-1.5 h-3 bg-surface-soft/50 rounded-sm animate-pulse" />
                <div className="mt-1 w-12 h-2.5 bg-surface-soft/30 rounded-sm animate-pulse" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Stepped Dashed Bar Column (Solid structural placeholder) */}
        <div 
          style={{
            clipPath: clipPaths[rank],
          }}
          className={`w-full ${heightClasses[rank]} border border-dashed border-border-strong/40 bg-surface-soft flex flex-col items-center justify-between py-3.5 px-2`}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-border-strong/40 text-[10px] font-black text-ink-soft leading-none">
            {rank}
          </div>
          <div className="text-[8px] font-black uppercase tracking-wider text-ink-soft/40 leading-none">
            empty
          </div>
          <div className="h-2 w-full" />
        </div>
      </div>
    );
  };

  const THEME = tabThemeConfig.leaderboard;

  return (
    <div className="space-y-5 pb-4">
      {/* Brand-Led Premium Header */}
      <div className="relative pb-2">
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
          className="display-hero flex !font-slackey pl-4 flex-row items-center gap-3 !tracking-tight whitespace-nowrap leading-none"
          style={{ color: THEME.accent }}
        >
          Dexters
          <motion.div
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.9, 0.93, 0.96, 1],
              ease: "easeInOut",
            }}
            className="shrink-0 origin-center"
          >
            <DexterEyes size={64} color={THEME.accent} />
          </motion.div>
        </motion.div>
      </div>
      
      {/* ── 2. Stepped Bar-Graph Podium ── */}
      <div className="pt-2 select-none">
        <div className="h-64 max-w-md mx-auto px-2 relative">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 16,
              staggerChildren: 0.08,
            }}
            className="flex items-end justify-center mt-2 h-full w-full relative"
          >
            {/* 2nd Place Column */}
            {podium[1] ? (
              renderPodiumBar(podium[1], 2)
            ) : (
              renderPodiumPlaceholder(2)
            )}

            {/* 1st Place Column */}
            {podium[0] ? (
              renderPodiumBar(podium[0], 1)
            ) : (
              renderPodiumPlaceholder(1)
            )}

            {/* 3rd Place Column */}
            {podium[2] ? (
              renderPodiumBar(podium[2], 3)
            ) : (
              renderPodiumPlaceholder(3)
            )}
          </motion.div>
        </div>
        {/* Divider line touching the bottom of the podium bars exactly */}
        <div className="border-t border-border-subtle w-full mt-0" />
      </div>

      {/* ── 3. Open Leaderboard List Layout ── */}
      <div className="space-y-3 pt-8 px-1 sm:px-2">

        {listRows.length > 0 ? (
          <div className="max-h-[380px] sm:max-h-[460px] overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                variants={listContainerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                key={scope}
                className="divide-y divide-border-subtle/50"
              >
                {listRows.map((row) => {
                  const isSelf = row.user.id === currentUserId;
                  const level = Math.floor(row.xp / 500) + 1;

                  return (
                    <motion.div
                      variants={listRowVariants}
                      key={row.user.id}
                      className={`flex items-center gap-3.5 py-3.5 px-2.5 transition-all duration-200 relative ${
                        isSelf
                          ? "bg-[color-mix(in_srgb,var(--theme-soft)_22%,transparent)]"
                          : "hover:bg-theme-wash/50"
                      }`}
                    >
                      {/* Sleek left accent strip for current user */}
                      {isSelf && (
                        <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[var(--theme-accent)] rounded-r-sm" />
                      )}

                      {/* Rank Number */}
                      <div
                        className="w-8 text-center text-[1.2rem] leading-none"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: isSelf ? "var(--theme-accent)" : "var(--foreground)",
                        }}
                      >
                        {row.rank}
                      </div>

                      {/* Avatar Badge */}
                      <div className="relative shrink-0">
                        <div className={`rounded-full overflow-hidden border shadow-sm ${"border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)] bg-surface" }`}>
                          <AvatarBadge avatarId={row.user.avatarId} size={40} />
                        </div>
                      </div>

                      {/* Username Stack */}
                      <div className="min-w-0 flex-1 pl-0.5">
                        <div
                          className="truncate leading-none"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.1rem",
                            letterSpacing: "0.01em",
                            color: isSelf ? "var(--theme-accent)" : "var(--foreground)",
                          }}
                        >
                          {row.user.displayName}
                        </div>
                        <div className="mt-1 text-[9px] text-ink-soft font-black uppercase tracking-wider">
                          {row.user.friendCode || "EXPLORER"}
                        </div>
                      </div>

                      {/* Card Rarity & XP */}
                      <div className="shrink-0 text-right flex flex-col items-end gap-1">
                        <div
                          className="font-black leading-none text-[1.15rem]"
                          style={{ fontFamily: "var(--font-slackey)", color: "var(--foreground)" }}
                        >
                          {row.xp}{" "}
                          <span className="text-[9px] font-black font-sans text-ink-soft uppercase pl-0.5">
                            XP
                          </span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.14em] px-2 py-0.5 rounded-full leading-none ${
                          "bg-[var(--theme-accent)] text-white shadow-xs" }`}>
                          Level {level}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-12 text-center text-ink-soft font-bold text-xs">
            No further explorers listed. Time to make history!
          </div>
        )}
              <div className="relative flex justify-center mt-8">
        <div className="relative inline-flex gap-[3px] rounded-[0.75rem] font-slackey bg-theme-accent px-2 py-2 shadow-md">
          {(["weekly", "monthly", "all-time"] as const).map((value) => {
            const active = scope === value;
            const label =
              value === "weekly"
                ? "Week"
                : value === "monthly"
                  ? "Month"
                  : "All Time";
            return (
              <button
                key={value}
                onClick={() => setScope(value)}
                className="relative z-10 min-w-[70px] px-3 py-2 text-[10px] font-slackey tracking-[0.08em] leading-none whitespace-nowrap transition-colors duration-250 select-none sm:min-w-[78px] sm:px-3.5"
                style={{
                  color: active ? "var(--theme-accent)" : "#FFFFFF",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="leaderboard-active-tab-bubble"
                    className="absolute inset-0 z-[-1] rounded-[0.5rem]"
                    style={{
                      backgroundColor: "#FFFFFF",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
