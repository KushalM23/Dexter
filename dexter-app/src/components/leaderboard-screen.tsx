"use client";

import { useState } from "react";

import { AvatarBadge } from "@/components/illustrations";
import { rarityColors } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

type LeaderboardRow = {
  rank: number;
  xp: number;
  topRarity: Rarity | null;
  user: {
    id: string;
    displayName: string;
    avatarId: string;
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
  const rows = scope === "weekly" ? weekly : scope === "monthly" ? monthly : allTime;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          ["weekly", "Weekly"],
          ["monthly", "Monthly"],
          ["all-time", "All Time"],
        ].map(([value, label]) => {
          const active = value === scope;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value as "weekly" | "monthly" | "all-time")}
              className="rounded-full border-[3px] border-[#1A1A1A] px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                backgroundColor: active ? "#E1BC29" : "#FAFAFF",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-[#FFF7BF] p-5">
        <div className="grid grid-cols-3 gap-3">
          {rows.slice(0, 3).map((row, index) => (
            <div
              key={row.user.id}
              className="rounded-[24px] border-[3px] border-[#1A1A1A] bg-white p-4 text-center"
              style={{ transform: `translateY(${index === 1 ? 16 : index === 2 ? 24 : 0}px)` }}
            >
              <div className="mx-auto mb-3 w-fit">
                <AvatarBadge avatarId={row.user.avatarId} size={74} />
              </div>
              <div className="font-[family:var(--font-display)] text-2xl leading-none">
                #{row.rank}
              </div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.16em]">
                {row.user.displayName}
              </div>
              <div className="mt-1 text-sm text-black/55">{row.xp} XP</div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {rows.map((row) => {
          const pinned = row.user.id === currentUserId;
          const tint = row.topRarity ? rarityColors[row.topRarity] : "#D1D5DB";

          return (
            <div
              key={row.user.id}
              className="flex items-center gap-4 rounded-[26px] border-[3px] border-[#1A1A1A] bg-white p-4"
              style={{
                boxShadow: pinned ? "0 0 0 4px rgba(225,188,41,0.55)" : undefined,
              }}
            >
              <div className="font-[family:var(--font-display)] text-3xl leading-none">
                {row.rank}
              </div>
              <AvatarBadge avatarId={row.user.avatarId} size={70} />
              <div className="min-w-0 flex-1">
                <div className="font-[family:var(--font-display)] text-2xl leading-none">
                  {row.user.displayName}
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-black/45">
                  {pinned ? "You" : "Explorer"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-[family:var(--font-display)] text-3xl leading-none">
                  {row.xp}
                </div>
                <div
                  className="mt-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em]"
                  style={{ backgroundColor: `${tint}22`, color: "#1A1A1A" }}
                >
                  {row.topRarity ?? "No cards"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
