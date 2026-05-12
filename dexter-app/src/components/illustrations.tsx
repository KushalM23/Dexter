import { tabTheme } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

const avatarPalettes = {
  "avatar-fox": { skin: "#FFB26B", accent: "#FE5F55", stroke: "#1A1A1A" },
  "avatar-frog": { skin: "#8EF58A", accent: "#2191FB", stroke: "#1A1A1A" },
  "avatar-moth": { skin: "#FFD670", accent: "#6536A7", stroke: "#1A1A1A" },
  "avatar-bloom": { skin: "#FF9AC1", accent: "#1FC147", stroke: "#1A1A1A" },
  "avatar-owl": { skin: "#CAB8FF", accent: "#E1BC29", stroke: "#1A1A1A" },
  "avatar-leaf": { skin: "#B1F39C", accent: "#1FC147", stroke: "#1A1A1A" },
  "avatar-beetle": { skin: "#8EE3EF", accent: "#2191FB", stroke: "#1A1A1A" },
  "avatar-mush": { skin: "#FFD9C0", accent: "#E40046", stroke: "#1A1A1A" },
  "avatar-seed": { skin: "#FFE87C", accent: "#FE5F55", stroke: "#1A1A1A" },
  "avatar-wave": { skin: "#9BD0FF", accent: "#7902BD", stroke: "#1A1A1A" },
  "avatar-petal": { skin: "#FFC6EC", accent: "#7902BD", stroke: "#1A1A1A" },
  "avatar-spark": { skin: "#FFF2B6", accent: "#FE5F55", stroke: "#1A1A1A" },
} as const;

export const avatarOptions = Object.keys(avatarPalettes);

export function DexeLogo({
  color = tabTheme.home,
  compact = false,
}: {
  color?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 120 120"
        className={compact ? "h-11 w-11" : "h-16 w-16"}
        aria-hidden="true"
      >
        <rect width="120" height="120" rx="36" fill={color} />
        <path
          d="M27 74C27 47 45 28 69 28C82 28 93 33 101 42L84 54C80 48 75 45 68 45C56 45 48 54 48 67C48 80 56 89 68 89C74 89 79 87 84 82L101 93C92 103 81 108 68 108C45 108 27 89 27 74Z"
          fill="#FAFAFF"
        />
        <path
          d="M78 18C82 27 88 34 97 38"
          stroke="#1A1A1A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M90 15C93 22 97 28 105 31"
          stroke="#1A1A1A"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-none">
        <div className="text-xs uppercase tracking-[0.32em] text-black/50">
          Wildlife Binder
        </div>
        <div className="font-[family:var(--font-display)] text-4xl text-[#191919]">
          DexE
        </div>
      </div>
    </div>
  );
}

export function AvatarBadge({
  avatarId,
  selected = false,
  size = 96,
}: {
  avatarId: string;
  selected?: boolean;
  size?: number;
}) {
  const palette =
    avatarPalettes[avatarId as keyof typeof avatarPalettes] ??
    avatarPalettes["avatar-fox"];

  return (
    <div
      className="relative rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#fffef7] p-2 shadow-[0_10px_0_0_rgba(26,26,26,0.08)]"
      style={{
        width: size,
        height: size,
        boxShadow: selected
          ? `0 0 0 6px ${palette.accent}`
          : "0 10px 0 rgba(26,26,26,0.08)",
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="42" fill={palette.skin} />
        <path
          d="M32 62C39 72 61 72 68 62"
          stroke={palette.stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse cx="38" cy="42" rx="6" ry="10" fill={palette.stroke} />
        <ellipse cx="62" cy="42" rx="6" ry="10" fill={palette.stroke} />
        <path
          d="M22 26C31 10 69 10 78 26"
          fill="none"
          stroke={palette.accent}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M22 27C28 34 34 38 40 39"
          fill="none"
          stroke={palette.stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M78 27C72 34 66 38 60 39"
          fill="none"
          stroke={palette.stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

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
          <path
            d="M54 66C45 76 45 89 56 98"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M71 70C70 82 73 92 80 100"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M48 58C34 45 28 38 22 24"
            stroke="#1A1A1A"
            strokeWidth="10"
            strokeLinecap="round"
          />
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
              rx="14"
              ry="18"
              fill="#1A1A1A"
              transform={`rotate(${index * 60} 60 60)`}
            />
          ))}
          <path
            d="M60 80V111"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M60 93C47 90 43 82 42 73"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M60 88C72 86 78 79 81 69"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </>
      );
    }

    if (className === "Fungi") {
      return (
        <>
          <path
            d="M27 61C34 34 87 34 94 61Z"
            fill="#1A1A1A"
            stroke="#1A1A1A"
            strokeWidth="6"
            strokeLinejoin="round"
          />
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
          <path
            d="M60 43C35 28 19 42 20 63C36 64 47 57 57 52"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M60 43C85 28 101 42 100 63C84 64 73 57 63 52"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <ellipse cx="60" cy="63" rx="16" ry="24" fill="#1A1A1A" />
          <path
            d="M54 80L40 98"
            stroke="#1A1A1A"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M66 80L80 98"
            stroke="#1A1A1A"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      );
    }

    if (className === "Reptilia") {
      return (
        <>
          <path
            d="M20 71C28 47 99 42 102 63C102 79 74 86 53 82C38 79 25 82 20 71Z"
            fill="#1A1A1A"
          />
          <circle cx="92" cy="58" r="5" fill={accent} />
          <path
            d="M36 75L23 95"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M56 79L44 100"
            stroke="#1A1A1A"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </>
      );
    }

    return (
      <>
        <ellipse cx="60" cy="66" rx="28" ry="22" fill="#1A1A1A" />
        <circle cx="47" cy="54" r="10" fill={accent} />
        <circle cx="73" cy="54" r="10" fill={accent} />
        <path
          d="M48 83L33 98"
          stroke="#1A1A1A"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M72 83L86 98"
          stroke="#1A1A1A"
          strokeWidth="8"
          strokeLinecap="round"
        />
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
