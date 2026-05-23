import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Camera, ChevronRight, Flame, Zap } from "lucide-react";

import { SpeciesCard } from "@/components/cards/species-card";
import { DexterEyes } from "@/components/ui/illustrations";
import {
  PosterEmptyState,
  ProgressRail,
  SectionDivider,
} from "@/components/ui/screen-primitives";
import { HOME_THEME } from "@/features/home/constants";
import type { HomeData } from "@/features/home/types";
import { getThemeStyle } from "@/lib/theme";

type HomeIdleStateProps = {
  data: HomeData;
  onViewChallenges: () => void;
  onViewDexe: () => void;
};

export function HomeIdleState({
  data,
  onViewChallenges,
  onViewDexe,
}: HomeIdleStateProps) {
  const latestCaptures = data.recentCaptures.slice(0, 2);

  return (
    <div
      className="theme-scope space-y-5 px-3 pb-10"
      style={getThemeStyle(HOME_THEME)}
    >
      <div className="relative pb-6">
        <motion.div 
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
          className="display-hero flex flex-row items-center gap-3 !tracking-tight whitespace-nowrap leading-none text-theme-accent"
        >
          Hey{" "} Dexter{" "}
          <motion.div
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
            className="shrink-0 origin-center"
          >
            <DexterEyes
              size={64}
              color={HOME_THEME.accent}
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="space-y-6 pb-6">
        <HomeStatRow
          icon={Flame}
          label="Streak"
          value={`${data.stats.streak}`}
        />
        <HomeStatRow
          icon={Zap}
          label="Weekly XP"
          value={`${data.stats.weeklyXp}`}
        />
        <HomeStatRow
          icon={Camera}
          label="Captures"
          value={`${data.stats.capturesToday}`}
        />
      </div>

      {data.activeChallenge ? (
        <motion.div 
          className="relative overflow-hidden rounded-3xl bg-theme-accent px-5 py-6 text-theme-contrast shadow-md border border-black/5"
        >
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none texture-overlay" aria-hidden="true" />
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70 drop-shadow-sm">
                Active challenge
              </div>
              <div className="display-section mt-3 leading-tight tracking-tight drop-shadow-md">
                {data.activeChallenge.title}
              </div>
              <p className="mt-2 text-sm leading-5 text-white/90 drop-shadow-sm font-medium">
                {data.activeChallenge.description}
              </p>
            </div>
            <div
              className="eyebrow-badge bg-surface text-xs shadow-sm"
              style={{ color: HOME_THEME.accent }}
            >
              {data.activeChallenge.xpReward} XP
            </div>
          </div>
          <div className="relative z-10 mt-5">
            <ProgressRail
              value={data.activeChallenge.progress}
              total={data.activeChallenge.targetCount}
              accent="#FFFFFF"
              soft="rgba(255,255,255,0.2)"
            />
          </div>
          <div className="relative z-10 mt-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-white/70 drop-shadow-sm">
            <span>
              {data.activeChallenge.progress}/{data.activeChallenge.targetCount}
            </span>
            <span>{data.activeChallenge.expiresLabel}</span>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="relative overflow-hidden rounded-3xl mb-8 bg-theme-accent px-4 py-6 text-center text-theme-contrast shadow-md border border-black/5"
        >
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none texture-overlay" aria-hidden="true" />
          
          <div className="relative z-10">
            <div className="font-display text-xl tracking-wide whitespace-nowrap text-white font-medium">
              No active challenges
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onViewChallenges}
              className="mt-2 inline-flex flex-row items-center gap-1 transition-opacity opacity-90 hover:opacity-100 drop-shadow-sm font-medium"
            >
              <span className="text-xs font-black tracking-[0.16em]">
                Check out all challenges
              </span>
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-slackey mt-4 text-xl whitespace-nowrap text-foreground font-medium">
            Recent captures
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onViewDexe}
            className="inline-flex translate-y-1.5 shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-black tracking-[0.16em] text-theme-accent transition-colors hover:bg-theme-accent/10"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={8} />
          </motion.button>
        </div>
        {latestCaptures.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {latestCaptures.map((entry) => (
              <div key={entry.collection.capturedAt} className="min-w-0">
                <SpeciesCard
                  compact
                  commonName={entry.card.commonName}
                  scientificName={entry.card.scientificName}
                  kingdom={entry.card.kingdom}
                  phylum={entry.card.phylum}
                  className={entry.card.className}
                  order={entry.card.order}
                  family={entry.card.family}
                  genus={entry.card.genus}
                  species={entry.card.species}
                  rarity={entry.collection.rarity}
                  xpValue={entry.collection.xpAwarded}
                  photoUrl={entry.card.photoUrl}
                  pixelArtUrl={entry.card.pixelArtUrl}
                  photoSource={entry.card.photoSource}
                  lore={entry.card.lore}
                  occurrenceCount={entry.card.occurrenceCount}
                  locationLabel={entry.collection.captureLocationLabel}
                  capturedAt={entry.collection.capturedAt}
                />
              </div>
            ))}
          </div>
        ) : (
          <PosterEmptyState
            title="No captures yet"
            body="Your first verified find will show up here the moment it joins the binder."
            accent={HOME_THEME.accent}
            soft={HOME_THEME.soft}
          />
        )}
      </div>
    </div>
  );
}

function HomeStatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 2 }}
      className="flex w-full items-center text-theme-accent transition-all"
    >
      <div className="flex shrink-0 items-center gap-2 text-xl uppercase tracking-wide [font-family:var(--font-slackey)]">
        <Icon size={24} strokeWidth={3} /> {label}
      </div>
      <div className="mx-4 flex-1 border-b-4 border-dotted border-black" />
      <div className="shrink-0 text-3xl text-theme-accent font-medium [font-family:var(--font-display)]">
        {value}
      </div>
    </motion.div>
  );
}
