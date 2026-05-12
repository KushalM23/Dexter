import type { Rarity } from "@/lib/types";

/* ── Avatar config (DiceBear Toon Head) ── */
const avatarMeta: Record<string, { bg: string; seed: string }> = {
  "avatar-1":  { bg: "#FFE0B2", seed: "Felix" },
  "avatar-2":  { bg: "#E8D5F5", seed: "Sophia" },
  "avatar-3":  { bg: "#D7CCC8", seed: "Milo" },
  "avatar-4":  { bg: "#FFF9C4", seed: "Luna" },
  "avatar-5":  { bg: "#F3E5F5", seed: "Zara" },
  "avatar-6":  { bg: "#FCE4EC", seed: "Cleo" },
  "avatar-7":  { bg: "#C8E6C9", seed: "Jasper" },
  "avatar-8":  { bg: "#B3E5FC", seed: "Nadia" },
  "avatar-9":  { bg: "#CFD8DC", seed: "Oliver" },
  "avatar-10": { bg: "#DCEDC8", seed: "Iris" },
  "avatar-11": { bg: "#F0E6D3", seed: "Maya" },
  "avatar-12": { bg: "#E0E0E0", seed: "Aria" },
};

export const avatarOptions = Object.keys(avatarMeta);

/** Build a DiceBear Toon Head URL for a given seed */
export function getAvatarUrl(avatarId: string, size = 128): string {
  const meta = avatarMeta[avatarId] ?? avatarMeta["avatar-1"];
  const bg = meta.bg.replace("#", "");
  return `https://api.dicebear.com/9.x/toon-head/svg?seed=${encodeURIComponent(meta.seed)}&backgroundColor=${bg}&size=${size}&beardProbability=0`;
}

/* ── Avatar Badge ── */
export function AvatarBadge({
  avatarId,
  selected = false,
  size = 96,
}: {
  avatarId: string;
  selected?: boolean;
  size?: number;
}) {
  const url = getAvatarUrl(avatarId, size * 2);

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-2xl transition-all"
        style={{
          width: size,
          height: size,
          transform: selected ? "scale(0.95)" : "scale(1)",
          boxShadow: selected ? "0 0 0 3px white" : "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Avatar"
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      {selected && (
        <div className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-md">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Dexter Eyes (App Logo) ── */
export function DexterEyes({ size = 160 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 120" width={size} aria-hidden="true">
      {/* Left eye */}
      <ellipse cx="62" cy="60" rx="42" ry="44" fill="white" stroke="#1A1A1A" strokeWidth="5" />
      <circle cx="62" cy="60" r="26" fill="#2191FB" />
      <circle cx="62" cy="60" r="16" fill="#8EC8FF" />
      <circle cx="62" cy="58" r="9" fill="#1A1A1A" />
      <circle cx="57" cy="50" r="5" fill="white" fillOpacity="0.8" />
      {/* Right eye */}
      <ellipse cx="138" cy="60" rx="42" ry="44" fill="white" stroke="#1A1A1A" strokeWidth="5" />
      <circle cx="138" cy="60" r="26" fill="#2191FB" />
      <circle cx="138" cy="60" r="16" fill="#8EC8FF" />
      <circle cx="138" cy="58" r="9" fill="#1A1A1A" />
      <circle cx="133" cy="50" r="5" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

/* ── Dexter Logo ── */
export function DexterLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <DexterEyes size={compact ? 56 : 80} />
      <div className="leading-none">
        <div className="text-xs uppercase tracking-[0.32em] text-black/50">
          Wildlife Binder
        </div>
        <div style={{ fontFamily: "var(--font-display)" }} className="text-4xl text-[#191919]">
          Dexter
        </div>
      </div>
    </div>
  );
}

/* ── Species Stamp ── */
export function SpeciesStamp({
  className,
  rarity,
}: {
  className: string;
  rarity: Rarity;
}) {
  const accent = {
    common: "#D3D7DB",
    uncommon: "#98E49E",
    rare: "#8EB7FF",
    epic: "#FF8AAC",
    legendary: "#BFA0FF",
  }[rarity];

  const renderBody = () => {
    if (className === "Aves") {
      return (
        <>
          <ellipse cx="68" cy="64" rx="26" ry="20" fill="#1A1A1A" />
          <ellipse cx="86" cy="52" rx="12" ry="12" fill="#1A1A1A" />
          <path d="M95 51L111 58L95 63Z" fill="#1A1A1A" />
          <path d="M54 66C45 76 45 89 56 98" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M71 70C70 82 73 92 80 100" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M48 58C34 45 28 38 22 24" stroke="#1A1A1A" strokeWidth="10" strokeLinecap="round" />
        </>
      );
    }
    if (className === "Plantae") {
      return (
        <>
          <circle cx="60" cy="60" r="18" fill="#1A1A1A" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <ellipse
              key={index}
              cx={60 + Math.cos((index / 6) * Math.PI * 2) * 28}
              cy={60 + Math.sin((index / 6) * Math.PI * 2) * 28}
              rx="14" ry="18" fill="#1A1A1A"
              transform={`rotate(${index * 60} 60 60)`}
            />
          ))}
          <path d="M60 80V111" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M60 93C47 90 43 82 42 73" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M60 88C72 86 78 79 81 69" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
        </>
      );
    }
    if (className === "Fungi") {
      return (
        <>
          <path d="M27 61C34 34 87 34 94 61Z" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="round" />
          <rect x="48" y="60" width="24" height="36" rx="10" fill="#1A1A1A" />
          <circle cx="44" cy="54" r="5" fill={accent} />
          <circle cx="58" cy="49" r="6" fill={accent} />
          <circle cx="74" cy="55" r="5" fill={accent} />
        </>
      );
    }
    if (className === "Insecta") {
      return (
        <>
          <path d="M60 43C35 28 19 42 20 63C36 64 47 57 57 52" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M60 43C85 28 101 42 100 63C84 64 73 57 63 52" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="60" cy="63" rx="16" ry="24" fill="#1A1A1A" />
          <path d="M54 80L40 98" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round" />
          <path d="M66 80L80 98" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round" />
        </>
      );
    }
    if (className === "Reptilia") {
      return (
        <>
          <path d="M20 71C28 47 99 42 102 63C102 79 74 86 53 82C38 79 25 82 20 71Z" fill="#1A1A1A" />
          <circle cx="92" cy="58" r="5" fill={accent} />
          <path d="M36 75L23 95" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
          <path d="M56 79L44 100" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
        </>
      );
    }
    return (
      <>
        <ellipse cx="60" cy="66" rx="28" ry="22" fill="#1A1A1A" />
        <circle cx="47" cy="54" r="10" fill={accent} />
        <circle cx="73" cy="54" r="10" fill={accent} />
        <path d="M48 83L33 98" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
        <path d="M72 83L86 98" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
      </>
    );
  };

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect width="120" height="120" rx="36" fill={accent} />
      <circle cx="94" cy="24" r="8" fill="#FAFAFF" fillOpacity="0.6" />
      <circle cx="24" cy="26" r="6" fill="#FAFAFF" fillOpacity="0.55" />
      {renderBody()}
    </svg>
  );
}
