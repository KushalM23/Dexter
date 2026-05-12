"use client";

import { useState } from "react";
import { ChevronDown, CircleCheckBig } from "lucide-react";

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
  };
};

export function ChallengesScreen({
  data,
}: {
  data: {
    daily: ChallengeEntry[];
    weekly: ChallengeEntry[];
    achievements: ChallengeEntry[];
  };
}) {
  return (
    <div className="space-y-4">
      <ChallengeSection title="Daily Challenges" items={data.daily} defaultOpen />
      <ChallengeSection title="Weekly Challenges" items={data.weekly} defaultOpen />
      <ChallengeSection title="Achievements" items={data.achievements} defaultOpen={false} />
    </div>
  );
}

function ChallengeSection({
  title,
  items,
  defaultOpen,
}: {
  title: string;
  items: ChallengeEntry[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-white p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between"
      >
        <div className="font-[family:var(--font-display)] text-3xl leading-none">
          {title}
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const percent = Math.min(
              100,
              (item.progress.progress / item.challenge.targetCount) * 100,
            );

            return (
              <div
                key={item.challenge.id}
                className="rounded-[24px] border-[3px] border-black/8 bg-[#FAFAFF] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-[family:var(--font-display)] text-2xl leading-none">
                      {title === "Achievements" && !item.progress.completed
                        ? "???"
                        : item.challenge.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-black/65">
                      {item.progress.completed || title !== "Achievements"
                        ? item.challenge.description
                        : "Hidden until unlocked."}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#1A1A1A] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                    {item.challenge.xpReward} XP
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#1FC147]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.22em] text-black/45">
                  <span>
                    {item.progress.progress}/{item.challenge.targetCount}
                  </span>
                  <span className="flex items-center gap-1">
                    {item.progress.completed ? (
                      <>
                        <CircleCheckBig className="h-4 w-4 text-[#1FC147]" />
                        Completed
                      </>
                    ) : (
                      "In Progress"
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
