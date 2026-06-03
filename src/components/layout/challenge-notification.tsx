"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ChallengeInfo {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "daily" | "weekly" | "achievement";
}

interface ChallengeNotificationContextType {
  checkChallenges: () => Promise<void>;
}

const ChallengeNotificationContext = createContext<
  ChallengeNotificationContextType | undefined
>(undefined);

export function useChallengeNotification() {
  const context = useContext(ChallengeNotificationContext);
  if (!context) {
    throw new Error(
      "useChallengeNotification must be used within a ChallengeNotificationProvider",
    );
  }
  return context;
}

export function ChallengeNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<ChallengeInfo[]>([]);
  const [activeNotification, setActiveNotification] =
    useState<ChallengeInfo | null>(null);

  // Initialize completed challenges on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("dexter_seen_completed_challenges");
    const seen = saved ? new Set<string>(JSON.parse(saved)) : null;

    const initialize = async () => {
      try {
        const response = await fetch("/api/challenges");
        if (!response.ok) return;

        const data = await response.json();
        const allCompleted = [
          ...(data.daily || []),
          ...(data.weekly || []),
          ...(data.achievements || []),
        ]
          .filter((entry: any) => entry.progress?.completed)
          .map((entry: any) => entry.challenge?.id);

        if (seen === null) {
          // First time launching this feature: populate local storage silently so we don't spam popups
          const initialSeen = new Set<string>(allCompleted);
          setSeenIds(initialSeen);
          localStorage.setItem(
            "dexter_seen_completed_challenges",
            JSON.stringify(Array.from(initialSeen)),
          );
        } else {
          setSeenIds(seen);
          // If we had seen IDs, check if any completed challenge is not yet seen
          const newlyCompleted: ChallengeInfo[] = [];
          for (const entry of [
            ...(data.daily || []),
            ...(data.weekly || []),
            ...(data.achievements || []),
          ]) {
            if (entry.progress?.completed && !seen.has(entry.challenge?.id)) {
              newlyCompleted.push({
                id: entry.challenge.id,
                title: entry.challenge.title,
                description: entry.challenge.description,
                xpReward: entry.challenge.xpReward,
                type: entry.challenge.type,
              });
            }
          }

          if (newlyCompleted.length > 0) {
            setQueue((prev) => [...prev, ...newlyCompleted]);
            // Add to seen immediately so we don't duplicate
            const nextSeen = new Set([...seen, ...newlyCompleted.map((c) => c.id)]);
            setSeenIds(nextSeen);
            localStorage.setItem(
              "dexter_seen_completed_challenges",
              JSON.stringify(Array.from(nextSeen)),
            );
          }
        }
      } catch (err) {
        console.error("Failed to initialize completed challenges:", err);
      }
    };

    void initialize();
  }, []);

  const checkChallenges = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).dexter_capture_active) {
      return;
    }
    try {
      const response = await fetch("/api/challenges");
      if (!response.ok) return;

      const data = await response.json();
      const allCompletedEntries = [
        ...(data.daily || []),
        ...(data.weekly || []),
        ...(data.achievements || []),
      ].filter((entry: any) => entry.progress?.completed);

      const newlyCompleted: ChallengeInfo[] = [];

      setSeenIds((currentSeen) => {
        const nextSeen = new Set(currentSeen);
        let updated = false;

        for (const entry of allCompletedEntries) {
          const id = entry.challenge?.id;
          if (id && !nextSeen.has(id)) {
            nextSeen.add(id);
            newlyCompleted.push({
              id,
              title: entry.challenge.title,
              description: entry.challenge.description,
              xpReward: entry.challenge.xpReward,
              type: entry.challenge.type,
            });
            updated = true;
          }
        }

        if (updated) {
          localStorage.setItem(
            "dexter_seen_completed_challenges",
            JSON.stringify(Array.from(nextSeen)),
          );
          setQueue((prev) => [...prev, ...newlyCompleted]);
        }

        return nextSeen;
      });
    } catch (err) {
      console.error("Failed to check completed challenges:", err);
    }
  }, []);

  // Listen to custom check events and route/pathname changes
  useEffect(() => {
    window.addEventListener("check-challenges", () => {
      void checkChallenges();
    });
    return () => {
      window.removeEventListener("check-challenges", () => {
        void checkChallenges();
      });
    };
  }, [checkChallenges]);

  useEffect(() => {
    // Check when pathname changes (e.g. user transitions to home, profile, dexe)
    void checkChallenges();
  }, [pathname, checkChallenges]);

  // Polling check every 10 seconds for standard syncing
  useEffect(() => {
    const timer = setInterval(() => {
      void checkChallenges();
    }, 10000);

    return () => clearInterval(timer);
  }, [checkChallenges]);

  // Handle active notification and queue popping
  useEffect(() => {
    if (!activeNotification && queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      setActiveNotification(next);
    }
  }, [queue, activeNotification]);

  // Auto-dismiss notification after 4.5 seconds
  useEffect(() => {
    if (!activeNotification) return;

    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [activeNotification]);

  return (
    <ChallengeNotificationContext.Provider value={{ checkChallenges }}>
      {children}

      {/* ── Notification UI Box ── */}
      <AnimatePresence mode="wait">
        {activeNotification && (
          <div className="absolute top-4 left-1/2 z-[100] w-auto pointer-events-none -translate-x-1/2">
            <motion.div
              key={activeNotification.id}
              initial={{ y: -55, x: "-50%", opacity: 0, scale: 0.85 }}
              animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
              exit={{ y: -35, x: "-50%", opacity: 0, scale: 0.85 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 24,
              }}
              onClick={() => setActiveNotification(null)}
              className="absolute left-1/2 top-0 pointer-events-auto flex flex-col items-center justify-center rounded-[0.75rem] font-slackey bg-[var(--theme-accent)] px-4.5 py-2 border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-[var(--theme-contrast)] select-none cursor-pointer w-max max-w-[280px]"
            >
              <span className="text-[10px] sm:text-[11px] tracking-[0.05em] uppercase leading-none whitespace-nowrap">
                {activeNotification.title} (+{activeNotification.xpReward} XP)
              </span>
              <span className="text-[7.5px] font-black font-sans mt-1 tracking-[0.2em] uppercase opacity-80 leading-none">
                complete
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ChallengeNotificationContext.Provider>
  );
}
