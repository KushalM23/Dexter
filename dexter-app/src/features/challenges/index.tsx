"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleCheckBig, LockKeyhole, TimerReset } from "lucide-react";

import {
  DataStrip,
  PosterEmptyState,
  ProgressRail,
  SectionDivider,
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
    assignedAt: string;
    expiresAt: string | null;
  };
};

const CHALLENGE_THEME = tabThemeConfig.challenges;

export function ChallengesScreen({
  data,
}: {
  data: {
    daily: ChallengeEntry[];
    weekly: ChallengeEntry[];
    achievements: ChallengeEntry[];
  };
}) {
  const totalCompleted = useMemo(
    () =>
      [...data.daily, ...data.weekly, ...data.achievements].filter(
        (entry) => entry.progress.completed,
      ).length,
    [data],
  );

  const totalChallenges =
    data.daily.length + data.weekly.length + data.achievements.length;

  return (
    <div className="space-y-6 pb-8">
      <DataStrip
        accent={CHALLENGE_THEME.accent}
        soft={CHALLENGE_THEME.soft}
        ink={CHALLENGE_THEME.ink}
        items={[
          { label: "Daily live", value: `${data.daily.length}`, note: "today" },
          { label: "Weekly live", value: `${data.weekly.length}`, note: "this week" },
          { label: "Completed", value: `${totalCompleted}`, note: `${totalChallenges} total` },
        ]}
      />

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
  const completedCount = items.filter((item) => item.progress.completed).length;

  return (
    <section className="panel-card px-5 py-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <div className="display-title-sm">{title}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-ink-soft">
            {completedCount}/{items.length} completed
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border-strong"
          style={{ backgroundColor: CHALLENGE_THEME.soft }}
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div className="mt-4">
        <ProgressRail
          value={completedCount}
          total={Math.max(items.length, 1)}
          accent={CHALLENGE_THEME.accent}
          soft="rgba(31,193,71,0.12)"
        />
      </div>

      {open ? (
        items.length > 0 ? (
          <div className="mt-5 space-y-4">
            {items.map((item) => {
              const lockedAchievement =
                title === "Achievements" && !item.progress.completed;

              return (
                <div
                  key={`${item.challenge.id}-${item.progress.expiresAt ?? item.progress.assignedAt ?? "permanent"}`}
                  className="space-y-3"
                >
                  <SectionDivider />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {lockedAchievement ? (
                          <LockKeyhole className="h-4 w-4 text-ink-soft" />
                        ) : null}
                        <div className="display-title-xs">
                          {lockedAchievement ? "???" : item.challenge.title}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-foreground px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                      {item.challenge.xpReward} XP
                    </div>
                  </div>

                  <ProgressRail
                    value={item.progress.progress}
                    total={item.challenge.targetCount}
                    accent={item.progress.completed ? "#1FC147" : CHALLENGE_THEME.accent}
                    soft="rgba(26,26,26,0.08)"
                  />

                  <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-ink-soft">
                    <span>
                      {item.progress.progress}/{item.challenge.targetCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {item.progress.completed ? (
                        <>
                          <CircleCheckBig className="h-4 w-4 text-[#1FC147]" />
                          Completed
                        </>
                      ) : (
                        <>
                          <TimerReset className="h-4 w-4" />
                          In progress
                        </>
                      )}
                    </span>
                  </div>
                  {item.progress.completedAt ? (
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/38">
                      Completed {formatDate(item.progress.completedAt)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <PosterEmptyState
              title="Nothing assigned"
              body=""
              accent={CHALLENGE_THEME.accent}
              soft={CHALLENGE_THEME.soft}
            />
          </div>
        )
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
