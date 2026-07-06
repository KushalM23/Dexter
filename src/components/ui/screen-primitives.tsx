"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="relative overflow-hidden py-6 px-6 flex flex-col items-center justify-center text-center">
      {/* Ambient Pulsing Gradient Blur */}
      
      <div className="relative z-10 max-w-sm mt-6 select-text">
        <h3 className="font-slackey text-2xl tracking-tight text-theme-accent leading-snug">
          {title}
        </h3>
        {body ? (
          <p className="mt-2.5 text-xs font-semibold leading-relaxed text-ink-muted tracking-wider px-4">
            {body}
          </p>
        ) : null}
      </div>
    </div>
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
      <div 
        className="w-full max-w-sm rounded-[32px] border-4 border-border-strong p-8 text-center relative overflow-hidden"
        style={{ 
          backgroundColor: soft, 
          boxShadow: `8px 8px 0 var(--border-strong)` 
        }}
      >
        {/* Playful background accent patterns */}
        <div 
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20" 
          style={{ backgroundColor: accent }} 
        />
        <div 
          className="absolute -left-8 -bottom-8 h-20 w-20 rounded-full border-[6px] opacity-20" 
          style={{ borderColor: accent }} 
        />

        <div className="relative z-10">
          {/* Animated blinking/confused Dexter Eyes */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
              className="origin-center"
            >
              <DexterEyes size={100} color={accent} />
            </motion.div>
          </div>

          {/* Heading */}
          <h2 className="display-title text-foreground text-2xl font-black leading-tight mb-3">
            {title}
          </h2>
          
          {/* Message */}
          <p className="text-sm leading-relaxed text-ink-muted font-semibold px-2 mb-8 select-text">
            {message}
          </p>

          {/* Neo-brutalist Try Again button */}
          {onRetry ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onRetry}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-border-strong py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0"
              style={{ 
                boxShadow: `4px 4px 0 var(--border-strong)`,
                backgroundColor: accent
              }}
            >
              <RefreshCcw className="h-4 w-4 stroke-[3]" />
              Try Again
            </motion.button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
