"use client";

import { useState } from "react";
import { Copy, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { AvatarBadge, avatarOptions } from "@/components/illustrations";
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

export function ProfileScreen({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(data.user.displayName);
  const [avatarId, setAvatarId] = useState(data.user.avatarId);
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const saveProfile = async () => {
    setIsPending(true);
    await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName, avatarId }),
    });
    setEditing(false);
    setIsPending(false);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-4">
            <AvatarBadge avatarId={avatarId} size={104} />
            <div>
              <div className="font-[family:var(--font-display)] text-4xl leading-none">
                {data.user.displayName}
              </div>
              <div className="mt-2 text-sm text-black/55">
                {data.user.email}
              </div>
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border-[3px] border-[#1A1A1A] bg-[#fff7bf] px-4 py-3 text-sm font-black uppercase tracking-[0.22em]">
                {data.user.friendCode}
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(data.user.friendCode);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied ? (
                <div className="mt-2 text-sm font-semibold text-[#2191FB]">
                  Copied.
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="rounded-full border-[3px] border-[#1A1A1A] bg-[#FAFAFF] p-3"
          >
            <PencilLine className="h-5 w-5" />
          </button>
        </div>
      </section>

      {editing ? (
        <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-[#FAFAFF] p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-black/45">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-[20px] border-[3px] border-[#1A1A1A] bg-white px-4 py-3 text-lg font-semibold"
            />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {avatarOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAvatarId(option)}
              >
                <AvatarBadge avatarId={option} selected={avatarId === option} />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={isPending}
            className="mt-5 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#7902BD] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
          >
            Save profile
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total cards"
          value={`${data.totalCards}`}
          tint="#FE5F55"
        />
        <MetricCard
          label="Total XP"
          value={`${data.user.totalXp}`}
          tint="#2191FB"
        />
        <MetricCard
          label="Global rank"
          value={data.globalRank ? `#${data.globalRank}` : "—"}
          tint="#E1BC29"
        />
        <MetricCard
          label="Current streak"
          value={`${data.streak} days`}
          tint="#1FC147"
        />
        <MetricCard
          label="Rarest catch"
          value={
            data.rarestCatch ? data.rarestCatch.card.commonName : "None yet"
          }
          tint="#7902BD"
        />
        <MetricCard
          label="This week"
          value={`${data.capturesThisWeek} captures`}
          tint="#2191FB"
        />
      </section>

      <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-white p-5">
        <div className="font-[family:var(--font-display)] text-3xl leading-none">
          Collection breakdown
        </div>
        <div className="mt-5 space-y-3">
          {data.breakdown.map((item) => (
            <div key={item.rarity}>
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.22em] text-black/45">
                <span>{item.rarity}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, item.count * 12)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border-[3px] border-[#1A1A1A] bg-white p-5">
        <div className="font-[family:var(--font-display)] text-3xl leading-none">
          Account
        </div>
        <p className="mt-3 text-sm leading-6 text-black/65">
          Linked Google account: {data.user.email}
        </p>
        <button
          type="button"
          onClick={async () => {
            const supabase = createSupabaseBrowserClient();
            await supabase.auth.signOut();
            router.push("/auth");
            router.refresh();
          }}
          className="mt-5 w-full rounded-[24px] border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-5 py-4 font-[family:var(--font-display)] text-2xl text-white"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="rounded-[26px] border-[3px] border-[#1A1A1A] bg-white p-4">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-black/45">
        {label}
      </div>
      <div
        className="mt-2 font-[family:var(--font-display)] text-3xl leading-none"
        style={{ color: tint }}
      >
        {value}
      </div>
    </div>
  );
}
