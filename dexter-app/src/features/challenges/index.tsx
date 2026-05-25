"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

import { DexterEyes } from "@/components/ui/illustrations";
import {
  PosterEmptyState,
  ProgressRail,
} from "@/components/ui/screen-primitives";
import { tabThemeConfig } from "@/lib/constants";

type ChallengeEntry = {
  challenge: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    targetCount: number;
    type: "daily" | "weekly" | "achievement";
  };
  progress: {
    progress: number;
    completed: boolean;
    completedAt: string | null;
    expiresAt: string | null;
    assignedAt?: string;
  };
};

const CHALLENGE_THEME = tabThemeConfig.challenges;

// ── Particle Explosion Component for satisfying completions ──
function ConfettiBurst() {
  const particles = Array.from({ length: 28 });
  const shapes = ["star", "circle"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
      {particles.map((_, i) => {
        const shape = shapes[i % shapes.length];
        const angle = (i / particles.length) * 360 + (Math.random() - 0.5) * 15;
        const velocity = 85 + Math.random() * 110;
        const radian = (angle * Math.PI) / 180;
        
        const targetX = Math.cos(radian) * velocity;
        const targetY = Math.sin(radian) * velocity - 70; // Float slightly upward
        
        const rotation = Math.random() * 720 - 360;
        const scale = 0.5 + Math.random() * 0.7;
        const duration = 1.3 + Math.random() * 0.7;
        const delay = Math.random() * 0.12;

        const colors = ["#1FC147", "#92E7A6", "#E1BC29", "#FFD95A", "#FFFFFF", "#34D399"];
        const color = colors[i % colors.length];

        return (
          <motion.div
            key={i}
            initial={{
              x: "50%",
              y: "50%",
              scale: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: `calc(50% + ${targetX}px)`,
              y: `calc(50% + ${targetY}px)`,
              scale: scale,
              opacity: [1, 1, 0],
              rotate: rotation,
            }}
            transition={{
              duration: duration,
              delay: delay,
              ease: "easeOut",
            }}
            className="absolute w-3 h-3"
            style={{ left: -6, top: -6 }}
          >
            {shape === "circle" ? (
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <circle cx="12" cy="12" r="10" fill={color} />
              </svg>
            ) : shape === "star" ? (
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"
                  fill={color}
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"
                  fill={color}
                />
              </svg>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function ChallengesScreen({
  data,
}: {
  data: {
    daily: ChallengeEntry[];
    weekly: ChallengeEntry[];
    achievements: ChallengeEntry[];
  };
}) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "achievements">("daily");

  const completedDailyCount = useMemo(() => data.daily.filter((item) => item.progress.completed).length, [data.daily]);
  const completedWeeklyCount = useMemo(() => data.weekly.filter((item) => item.progress.completed).length, [data.weekly]);
  const completedAchievementsCount = useMemo(() => data.achievements.filter((item) => item.progress.completed).length, [data.achievements]);
  
  // Track previously completed challenges to detect first-time completions in the browser
  const [seenCompletedIds, setSeenCompletedIds] = useState<Set<string>>(new Set());
  const [newlyCompletedIds, setNewlyCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dexter_seen_completed_challenges");
      const seen = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
      
      const allCompleted = [...data.daily, ...data.weekly, ...data.achievements]
        .filter((entry) => entry.progress.completed)
        .map((entry) => entry.challenge.id);

      const newlyCompleted = new Set<string>();
      for (const id of allCompleted) {
        if (!seen.has(id)) {
          newlyCompleted.add(id);
        }
      }

      setSeenCompletedIds(seen);
      if (newlyCompleted.size > 0) {
        setNewlyCompletedIds(newlyCompleted);
        
        // Save to localStorage immediately so they aren't animated next visit
        const nextSeen = new Set([...seen, ...newlyCompleted]);
        localStorage.setItem("dexter_seen_completed_challenges", JSON.stringify(Array.from(nextSeen)));
      }
    }
  }, [data]);

  // Overall statistics
  const totalCompleted = useMemo(
    () =>
      [...data.daily, ...data.weekly, ...data.achievements].filter(
        (entry) => entry.progress.completed,
      ).length,
    [data],
  );

  const totalChallenges =
    data.daily.length + data.weekly.length + data.achievements.length;

  const progressRatio = totalChallenges > 0 ? totalCompleted / totalChallenges : 0;

  // Frontend Sorting: COMPLETED items strictly at the TOP, then sorted chronologically by assigned date
  const sortedItems = useMemo(() => {
    const list =
      activeTab === "daily"
        ? data.daily
        : activeTab === "weekly"
          ? data.weekly
          : data.achievements;

    return [...list].sort((left, right) => {
      const leftComplete = left.progress.completed;
      const rightComplete = right.progress.completed;

      if (leftComplete && !rightComplete) return -1;
      if (!leftComplete && rightComplete) return 1;

      return (
        new Date(right.progress.assignedAt || 0).getTime() -
        new Date(left.progress.assignedAt || 0).getTime()
      );
    });
  }, [data, activeTab]);

  // SVG Radial Progress ring properties
  const radius = 38;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="space-y-6 pb-12 theme-scope select-none text-balance">
      {/* ── Injection of the satisfaction glint CSS effect ── */}
      <style>{`
        @keyframes glint-sweep {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .animate-glint {
          animation: glint-sweep 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--theme-chrome) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--theme-chrome);
          opacity: 0.3;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }
      `}</style>

      {/* ── 1. Page Heading ── */}
              <motion.div 
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
                className="font-slackey text-3xl flex flex-row items-center pl-4 gap-3 !tracking-tight whitespace-nowrap leading-none text-theme-accent"
              >
                Challenges{" "}
                <motion.div
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
                  className="shrink-0 origin-center"
                >
                  <DexterEyes
                    size={64}
                    color={CHALLENGE_THEME.accent}
                  />
                </motion.div>
              </motion.div>

      {/* ── 3. High-Fidelity Challenge Feed List ── */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {sortedItems.length > 0 ? (
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 },
                },
                exit: {
                  opacity: 0,
                  transition: { staggerChildren: 0.02, staggerDirection: -1 },
                },
              }}
              className={`px-1 custom-scrollbar divide-y divide-border-subtle/50 ${
                activeTab === "achievements" ? "max-h-[549px] sm:max-h-[350px] overflow-y-auto" : ""
              }`}
            >
              {sortedItems.map((item) => {
                const isCompleted = item.progress.completed;
                const isNewlyCompleted = newlyCompletedIds.has(item.challenge.id);
                const isAchievement = activeTab === "achievements";
                const isLockedAchievement = isAchievement && !isCompleted;

                // Framer Motion row transition details
                const rowVariants = {
                  hidden: { y: 15, opacity: 0 },
                  show: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring" as const,
                      stiffness: 300,
                      damping: 24,
                    },
                  },
                  exit: {
                    y: -10,
                    opacity: 0,
                    transition: { duration: 0.15 },
                  },
                };

                return (
                  <motion.div
                    key={item.challenge.id}
                    layout="position"
                    {...(isNewlyCompleted
                      ? {
                          initial: { scale: 0.98, y: 10, opacity: 0 },
                          animate: {
                            scale: [1, 1.01, 1],
                            y: 0,
                            opacity: 1,
                          },
                          transition: {
                            scale: {
                              duration: 0.6,
                              ease: "easeInOut",
                            },
                            y: {
                              type: "spring",
                              stiffness: 140,
                              damping: 11,
                            },
                            opacity: {
                              duration: 0.3,
                            }
                          },
                        }
                      : {
                          variants: rowVariants,
                        })}
                    className={`relative overflow-hidden py-5 pr-2.5 transition-all duration-200 ${
                      isCompleted ? "pl-4 bg-[color-mix(in_srgb,var(--theme-soft)_22%,transparent)]" : "pl-3"
                    } ${
                      isNewlyCompleted
                        ? "bg-gradient-to-r from-[rgba(31,193,71,0.08)] to-[rgba(31,193,71,0.02)]"
                        : isLockedAchievement
                          ? "bg-surface-soft/20 opacity-80"
                          : !isCompleted ? "hover:bg-theme-wash/30" : ""
                    }`}
                  >
                    {/* Sleek left accent strip for completed tasks */}
                    {isCompleted && (
                      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[var(--theme-accent)] rounded-r-sm" />
                    )}

                    {/* Satisfying shine glint anim overlay */}
                    {isNewlyCompleted && (
                      <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none z-10 animate-glint" />
                    )}

                    {/* Particle explosion effect for new completions */}
                    {isNewlyCompleted && <ConfettiBurst />}

                    {/* Core Item Padding & Layout */}
                    <div className="relative flex flex-col gap-3">
                      {/* Title + XP Header Row */}
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <h3
                            className={`font-display uppercase tracking-wider leading-none ${isCompleted ? "text-[var(--theme-accent)]" : "text-black"}`}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {isLockedAchievement ? "???" : item.challenge.title}
                          </h3>
                        </div>

                        {/* XP Badge */}
                        <div
                          className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[8.5px] font-black uppercase text-white tracking-[0.15em] bg-[var(--theme-accent)]`}
                        >
                          {item.challenge.xpReward} XP
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        className="text-[10.5px] leading-snug text-ink-muted -mt-1"
                      >
                        {isLockedAchievement
                          ? "Complete this achievement to reveal details."
                          : item.challenge.description}
                      </p>

                      {/* Progress Metrics & Bar */}
                      <div className="flex items-center gap-4 mt-0.5">
                        <div className="flex-1">
                          <ProgressRail
                            value={item.progress.progress}
                            total={item.challenge.targetCount}
                            accent={isCompleted ? "#1FC147" : "var(--theme-accent)"}
                            soft="rgba(26,26,26,0.06)"
                          />
                        </div>
                        <span className="shrink-0 text-[8.5px] font-black uppercase tracking-wider text-ink-soft min-w-[28px] text-right leading-none">
                          {item.progress.progress} / {item.challenge.targetCount}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <PosterEmptyState
                title="No challenges"
                body={`We don't have any challenges for you right now`}
                accent={CHALLENGE_THEME.accent}
                soft={CHALLENGE_THEME.soft}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {activeTab === "achievements" && (
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none z-20" />
        )}
      </div>

      {/* Divider line above the tab switcher exactly like leaderboard */}
      <div className="border-t border-border-subtle w-full mt-2" />

      {/* ── 2. Replicated Leaderboard Navigation Tab Controller ── */}
      <motion.div
        layout="position"
        className="relative flex justify-center mt-3 select-none"
      >
        <motion.div
          layout="position"
          className="relative inline-flex gap-[3px] rounded-[0.75rem] font-slackey bg-theme-accent px-2 py-2 shadow-md"
        >
          {(["daily", "weekly", "achievements"] as const).map((value) => {
            const active = activeTab === value;
            const label =
              value === "daily"
                ? "Daily"
                : value === "weekly"
                  ? "Weekly"
                  : "Achievements";
            
            const completedCount =
              value === "daily"
                ? completedDailyCount
                : value === "weekly"
                  ? completedWeeklyCount
                  : completedAchievementsCount;

            const totalCount =
              value === "daily"
                ? data.daily.length
                : value === "weekly"
                  ? data.weekly.length
                  : data.achievements.length;

            return (
              <motion.button
                layout="position"
                key={value}
                onClick={() => setActiveTab(value)}
                className="relative z-10 min-w-[80px] px-3.5 py-1.5 flex flex-col items-center justify-center transition-colors duration-250 select-none sm:min-w-[90px]"
                style={{
                  color: active ? "var(--theme-accent)" : "#FFFFFF",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="challenges-active-tab-bubble"
                    className="absolute inset-0 z-[-1] rounded-[0.5rem]"
                    style={{
                      backgroundColor: "#FFFFFF",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="font-slackey text-[10px] sm:text-[11px] tracking-[0.08em] leading-none uppercase">
                  {label}
                </span>
                <span className={`text-[8.5px] font-black font-sans mt-1.5 tracking-wider leading-none ${active ? "text-theme-accent" : "text-white/80"}`}>
                  {completedCount} / {totalCount}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Date Formatting Helper ──

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
