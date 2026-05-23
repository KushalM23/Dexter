"use client";

import { useMemo, useState } from "react";
import { Crown, Medal, Sparkles } from "lucide-react";

import { AvatarBadge } from "@/components/ui/illustrations";
import { rarityColors, tabThemeConfig } from "@/lib/constants";
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

const LEADERBOARD_THEME = tabThemeConfig.leaderboard;

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
  const podium = rows.slice(0, 3);
  const currentUser = useMemo(
    () => rows.find((row) => row.user.id === currentUserId) ?? null,
    [currentUserId, rows],
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex gap-2 overflow-x-auto pb-1">
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
              className="rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
              style={{
                backgroundColor: active ? LEADERBOARD_THEME.accent : "#FFFFFF",
                borderColor: "#1A1A1A",
                color: active ? LEADERBOARD_THEME.contrast : "#1A1A1A",
                boxShadow: active ? `4px 4px 0 ${LEADERBOARD_THEME.chrome}` : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {podium.length > 0 ? (
        <section className="rounded-4xl border-2 border-[#1A1A1A] bg-[#FFFDF4] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div
              className="display-title-sm"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Top explorers
            </div>
            <div className="rounded-full bg-[#1A1A1A] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              {scope}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 items-end gap-3">
            {podium.map((row, index) => {
              const height = [148, 178, 132][index] ?? 132;
              const tint = podiumColor(index);

              return (
                <div key={row.user.id} className="flex flex-col items-center text-center">
                  <div className="mb-3">
                    <AvatarBadge avatarId={row.user.avatarId} size={78} />
                  </div>
                  <div
                    className="w-full rounded-t-3xl border-4 border-b-0 border-[#1A1A1A] px-3 pt-4"
                    style={{ backgroundColor: tint, minHeight: height }}
                  >
                    <div className="flex justify-center">
                      {index === 0 ? (
                        <Crown className="h-5 w-5 fill-[#1A1A1A] text-[#1A1A1A]" />
                      ) : (
                        <Medal className="h-5 w-5 text-[#1A1A1A]" />
                      )}
                    </div>
                    <div
                      className="display-title-xs mt-3 leading-none"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      #{row.rank}
                    </div>
                    <div className="mt-2 text-xs font-black uppercase tracking-[0.14em]">
                      {row.user.displayName}
                    </div>
                    <div className="mt-2 pb-4 text-sm font-semibold">{row.xp} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {currentUser ? (
        <section className="rounded-4xl border-2 border-[#1A1A1A] bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1A1A1A]"
                style={{ backgroundColor: LEADERBOARD_THEME.soft }}
              >
                <Sparkles className="h-5 w-5 text-[#1A1A1A]" />
              </div>
              <div
                className="display-title-xs leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                #{currentUser.rank} with {currentUser.xp} XP
              </div>
            </div>
            <RarityBadge rarity={currentUser.topRarity} />
          </div>
        </section>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => {
          const pinned = row.user.id === currentUserId;

          return (
            <section
              key={row.user.id}
              className="rounded-3xl border-2 border-[#1A1A1A] px-4 py-4"
              style={{ backgroundColor: pinned ? "#FFF7D6" : "#FFFFFF" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="display-title-sm w-10 text-center leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {row.rank}
                </div>
                <AvatarBadge avatarId={row.user.avatarId} size={64} />
                <div className="min-w-0 flex-1">
                  <div
                    className="display-title-xs truncate leading-none"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {row.user.displayName}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="display-title-xs leading-none"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {row.xp}
                  </div>
                  <div className="mt-2">
                    <RarityBadge rarity={row.topRarity} />
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: Rarity | null }) {
  const tint = rarity ? rarityColors[rarity] : "#E5E7EB";

  return (
    <div
      className="rounded-full border border-black/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]"
      style={{ backgroundColor: `${tint}22`, color: "#1A1A1A" }}
    >
      {rarity ?? "No cards"}
    </div>
  );
}

function podiumColor(index: number) {
  return ["#F7D96B", "#D9E0EA", "#F6C392"][index] ?? "#F7D96B";
}
