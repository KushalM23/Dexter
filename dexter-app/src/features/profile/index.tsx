"use client";

import { useState } from "react";
import { Copy, PencilLine, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { AvatarBadge, avatarOptions } from "@/components/ui/illustrations";
import {
  DataStrip,
  PosterPanel,
  ProgressRail,
  SectionDivider,
} from "@/components/ui/screen-primitives";
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
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async () => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName, avatarId }),
      });

      if (!response.ok) {
        throw new Error("Could not save your profile just yet.");
      }

      setEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile just yet.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PosterPanel accent={PROFILE_THEME.accent} soft="#FFFFFF">
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <AvatarBadge avatarId={avatarId} size={108} />
              <div className="min-w-0">
                <div
                  className="display-title-sm"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {data.user.displayName}
                </div>
                <div className="mt-2 text-sm text-black/55">{data.user.email}</div>
                <div className="mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#1A1A1A] bg-[#FBF6FF] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1A1A1A]">
                  {data.user.friendCode}
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(data.user.friendCode);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {copied ? (
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#7902BD]">
                    Copied
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-[#FBF6FF]"
            >
              <PencilLine className="h-5 w-5" />
            </button>
          </div>
        </div>
      </PosterPanel>

      {editing ? (
        <PosterPanel accent={PROFILE_THEME.accent} soft="#FBF6FF">
          <div className="space-y-5 px-5 py-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
                Display name
              </div>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-3xl border-2 border-[#1A1A1A] bg-white px-4 py-3 text-lg font-semibold text-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
                Explorer icon
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {avatarOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAvatarId(option)}
                    className="justify-self-start"
                  >
                    <AvatarBadge avatarId={option} selected={avatarId === option} size={74} />
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border-2 border-[#1A1A1A] bg-white px-4 py-3 text-sm font-semibold text-[#5B241F]">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border-2 border-[#1A1A1A] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#1A1A1A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isPending}
                className="rounded-full bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:opacity-70"
              >
                {isPending ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </PosterPanel>
      ) : null}

      <DataStrip
        accent={PROFILE_THEME.accent}
        soft={PROFILE_THEME.soft}
        ink={PROFILE_THEME.ink}
        items={[
          { label: "Total cards", value: `${data.totalCards}`, note: "captured" },
          { label: "Total XP", value: `${data.user.totalXp}`, note: "earned" },
          {
            label: "Global rank",
            value: data.globalRank ? `#${data.globalRank}` : "—",
            note: "all time",
          },
        ]}
      />

      <PosterPanel accent={PROFILE_THEME.accent} soft="#FFFFFF">
        <div className="space-y-5 px-5 py-5">
          <div
            className="display-title-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Snapshot
          </div>
          <SectionDivider />
          <div className="grid grid-cols-2 gap-3">
            <MetricPanel label="Current streak" value={`${data.streak} days`} accent="#1FC147" soft="#EFFFF3" />
            <MetricPanel label="This week" value={`${data.capturesThisWeek} captures`} accent="#2191FB" soft="#F4FAFF" />
            <MetricPanel
              label="Rarest catch"
              value={data.rarestCatch ? data.rarestCatch.card.commonName : "None yet"}
              accent="#FE5F55"
              soft="#FFF3F1"
            />
            <MetricPanel
              label="Top rarity"
              value={data.rarestCatch ? data.rarestCatch.collection.rarity : "unranked"}
              accent="#7902BD"
              soft="#FBF6FF"
            />
          </div>
        </div>
      </PosterPanel>

      <PosterPanel accent={PROFILE_THEME.accent} soft="#FFFFFF">
        <div className="space-y-5 px-5 py-5">
          <div
            className="display-title-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Breakdown
          </div>

          <div className="space-y-4">
            {data.breakdown.map((item) => (
              <div key={item.rarity}>
                <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-black/45">
                  <span>{item.rarity}</span>
                  <span>{item.count}</span>
                </div>
                <ProgressRail
                  value={item.count}
                  total={Math.max(...data.breakdown.map((entry) => entry.count), 1)}
                  accent={item.color}
                  soft="rgba(26,26,26,0.08)"
                />
              </div>
            ))}
          </div>
        </div>
      </PosterPanel>

      <PosterPanel accent={PROFILE_THEME.accent} soft="#FBF6FF">
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white">
              <ShieldCheck className="h-5 w-5 text-[#1A1A1A]" />
            </div>
            <div>
              <div
                className="display-title-xs"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Account
              </div>
              <p className="mt-1 text-sm text-black/55">{data.user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/auth");
              router.refresh();
            }}
            className="rounded-full bg-[#1A1A1A] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white"
          >
            Sign out
          </button>
        </div>
      </PosterPanel>
    </div>
  );
}

function MetricPanel({
  label,
  value,
  accent,
  soft,
}: {
  label: string;
  value: string;
  accent: string;
  soft: string;
}) {
  return (
    <div
      className="rounded-3xl border border-black/10 px-4 py-4"
      style={{ backgroundColor: soft }}
    >
      <div className="text-xs font-black uppercase tracking-[0.16em] text-black/45">
        {label}
      </div>
      <div
        className="display-title-xs mt-3"
        style={{ color: accent, fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
