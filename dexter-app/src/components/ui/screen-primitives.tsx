"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { DexterEyes } from "@/components/ui/illustrations";

type Accentable = {
  accent: string;
  ink?: string;
  soft?: string;
};

export function SectionTitle({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        <div className="display-title-sm text-foreground">{title}</div>
        {subtitle ? (
          <p className="max-w-md text-sm leading-6 text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
      <div className="hidden shrink-0 sm:block">
        <DexterEyes size={54} color={accent} />
      </div>
    </div>
  );
}

export function SectionDivider() {
  return <div className="section-divider" />;
}

export function TabActionBadge({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="eyebrow-badge theme-badge">{children}</div>;
}

export function DataStrip({
  accent,
  soft,
  ink,
  items,
}: Accentable & {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div
      className="grid overflow-hidden rounded-4xl border border-border-subtle"
      style={{
        backgroundColor: soft ?? "var(--surface)",
        boxShadow: `0 18px 40px -28px ${accent}55`,
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className="px-4 py-4"
          style={{
            borderLeft: index === 0 ? "none" : "1px solid var(--border-subtle)",
          }}
        >
          <div className="text-xs font-black uppercase tracking-[0.2em] text-ink-soft">
            {item.label}
          </div>
          <div
            className="display-title-sm mt-2 leading-none"
            style={{ color: ink ?? "var(--foreground)", fontFamily: "var(--font-display)" }}
          >
            {item.value}
          </div>
          {item.note ? (
            <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
              {item.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PosterPanel({
  accent,
  soft,
  children,
  className = "",
}: Accentable & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-4xl border border-border-subtle ${className}`.trim()}
      style={{
        backgroundColor: soft ?? "var(--surface)",
        boxShadow: `0 20px 44px -30px ${accent}66`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-75"
        style={{ backgroundColor: `${accent}22` }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-4 h-24 w-24 rounded-full border-8"
        style={{ borderColor: `${accent}22` }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}

export function PosterEmptyState({
  title,
  body,
  accent,
  soft,
  hideIcon,
}: {
  title: string;
  body: string;
  accent: string;
  soft: string;
  hideIcon?: boolean;
}) {
  return (
    <PosterPanel accent={accent} soft={soft}>
      <div className="px-6 py-9 text-center">
        {!hideIcon ? (
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-border-strong bg-surface"
            style={{ boxShadow: `6px 6px 0 ${accent}` }}
          >
            <DexterEyes size={36} color={accent} />
          </div>
        ) : null}
        <div className="display-title-sm mt-5 text-foreground">{title}</div>
        {body ? <p className="mt-3 text-sm leading-6 text-ink-muted">{body}</p> : null}
      </div>
    </PosterPanel>
  );
}

export function ProgressRail({
  value,
  total,
  accent,
  soft,
}: {
  value: number;
  total: number;
  accent: string;
  soft?: string;
}) {
  const width = total <= 0 ? 0 : Math.max(6, Math.min(100, (value / total) * 100));

  return (
    <div
      className="h-3 overflow-hidden rounded-full border border-border-subtle"
      style={{ backgroundColor: soft ?? "rgb(255 255 255 / 0.6)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, backgroundColor: accent }}
      />
    </div>
  );
}

export function RouteLoadingScreen({
  title = "Loading your binder",
  message = "Sorting captures, tallying XP, and laying out the next page.",
  accent = "#2191FB",
  soft = "#D8ECFF",
}: {
  title?: string;
  message?: string;
  accent?: string;
  soft?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <PosterPanel accent={accent} soft={soft} className="w-full max-w-sm">
        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex w-fit gap-2">
            <LogoLoader />
          </div>
          <div className="display-title mt-5 text-foreground">{title}</div>
          <p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>
        </div>
      </PosterPanel>
    </div>
  );
}

export function LogoLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="loader scale-[1.9]" aria-hidden="true" />
    </div>
  );
}

export function SkeletonBlock({
  className,
  accent = "#D8ECFF",
}: {
  className: string;
  accent?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-3xl ${className}`.trim()}
      style={{ backgroundColor: accent }}
    />
  );
}

export function RouteErrorState({
  title,
  message,
  accent,
  soft,
  onRetry,
}: {
  title: string;
  message: string;
  accent: string;
  soft: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <PosterPanel accent={accent} soft={soft} className="w-full max-w-sm">
        <div className="px-6 py-8 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-border-strong bg-surface"
            style={{ boxShadow: `6px 6px 0 ${accent}` }}
          >
            <AlertTriangle className="h-7 w-7 text-foreground" />
          </div>
          <div className="display-title mt-5 text-foreground">{title}</div>
          <p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </button>
          ) : null}
        </div>
      </PosterPanel>
    </div>
  );
}
