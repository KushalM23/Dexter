"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { DexterEyes } from "@/components/ui/illustrations";
import { Tabs, TabsContent, TabsContents } from "@/components/ui/tabs";
import type { TabSlug } from "@/lib/types";

// Import all screens
import { HomeScreen } from "@/features/home";
import { CollectionScreen } from "@/features/collection";
import { ChallengesScreen } from "@/features/challenges";
import { LeaderboardScreen } from "@/features/leaderboard";
import { ProfileScreen } from "@/features/profile";

// Import actions
import {
  fetchCollectionDataAction,
  fetchChallengesDataAction,
  fetchLeaderboardDataAction,
  fetchProfileDataAction,
} from "@/app/actions";

interface AppShellClientProps {
  userId: string;
  initialTab: TabSlug;
  preloadedData: Record<TabSlug, any>;
}

function TabSkeleton({ accent = "#2191FB" }: { accent?: string }) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center py-12 text-center">
      <motion.div
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
        className="origin-center mb-6"
      >
        <DexterEyes size={120} color={accent} />
      </motion.div>
      <p className="text-xs font-display tracking-[0.18em] text-ink-muted animate-pulse">
        Looking....
      </p>
    </div>
  );
}

export function AppShellClient({
  userId,
  initialTab,
  preloadedData,
}: AppShellClientProps) {
  const searchParams = useSearchParams();
  const urlTab = (searchParams.get("tab") as TabSlug) || "home";
  
  const [activeTab, setActiveTab] = useState<TabSlug>(initialTab);

  const [data, setData] = useState<Record<TabSlug, any>>({
    home: preloadedData.home,
    dexe: preloadedData.dexe,
    challenges: preloadedData.challenges,
    leaderboard: preloadedData.leaderboard,
    profile: preloadedData.profile,
  });

  const [loadingMap, setLoadingMap] = useState<Record<TabSlug, boolean>>({
    home: false,
    dexe: false,
    challenges: false,
    leaderboard: false,
    profile: false,
  });

  // Sync with URL query parameter
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Lazy load data for the active tab if not loaded
  useEffect(() => {
    if (data[activeTab] || loadingMap[activeTab]) {
      return;
    }

    const loadData = async () => {
      setLoadingMap(prev => ({ ...prev, [activeTab]: true }));
      try {
        let result: any;
        if (activeTab === "home") {
          const { fetchHomeDataAction } = await import("@/app/actions");
          result = await fetchHomeDataAction();
        } else if (activeTab === "dexe") {
          result = await fetchCollectionDataAction();
        } else if (activeTab === "challenges") {
          result = await fetchChallengesDataAction();
        } else if (activeTab === "leaderboard") {
          result = await fetchLeaderboardDataAction();
        } else if (activeTab === "profile") {
          result = await fetchProfileDataAction();
        }
        setData(prev => ({ ...prev, [activeTab]: result }));
      } catch (err) {
        console.error(`Failed to load data for tab ${activeTab}:`, err);
      } finally {
        setLoadingMap(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    loadData();
  }, [activeTab, data, loadingMap]);

  // Background prefetch for all other tabs after initial mount
  useEffect(() => {
    const prefetchTabs = async () => {
      const tabsToPrefetch: TabSlug[] = ["home", "dexe", "challenges", "leaderboard", "profile"];
      
      for (const tab of tabsToPrefetch) {
        let alreadyExists = false;
        setData(prev => {
          if (prev[tab]) {
            alreadyExists = true;
          }
          return prev;
        });
        if (alreadyExists) continue;

        try {
          let result: any;
          if (tab === "home") {
            const { fetchHomeDataAction } = await import("@/app/actions");
            result = await fetchHomeDataAction();
          } else if (tab === "dexe") {
            result = await fetchCollectionDataAction();
          } else if (tab === "challenges") {
            result = await fetchChallengesDataAction();
          } else if (tab === "leaderboard") {
            result = await fetchLeaderboardDataAction();
          } else if (tab === "profile") {
            result = await fetchProfileDataAction();
          }
          setData(prev => {
            if (prev[tab]) return prev;
            return { ...prev, [tab]: result };
          });
        } catch (err) {
          console.error(`Background prefetch failed for tab ${tab}:`, err);
        }
      }
    };

    const timer = setTimeout(() => {
      prefetchTabs();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Listen for custom refetch/refresh events (e.g. from HomeScreen on captures)
  useEffect(() => {
    const handleRefresh = async () => {
      setLoadingMap(prev => ({ ...prev, [activeTab]: true }));
      try {
        let result: any;
        if (activeTab === "home") {
          const { fetchHomeDataAction } = await import("@/app/actions");
          result = await fetchHomeDataAction();
        } else if (activeTab === "dexe") {
          result = await fetchCollectionDataAction();
        } else if (activeTab === "challenges") {
          result = await fetchChallengesDataAction();
        } else if (activeTab === "leaderboard") {
          result = await fetchLeaderboardDataAction();
        } else if (activeTab === "profile") {
          result = await fetchProfileDataAction();
        }
        
        // Reset all other tabs to trigger fresh fetches when switching,
        // and update the active tab immediately.
        setData({
          home: activeTab === "home" ? result : null,
          dexe: activeTab === "dexe" ? result : null,
          challenges: activeTab === "challenges" ? result : null,
          leaderboard: activeTab === "leaderboard" ? result : null,
          profile: activeTab === "profile" ? result : null,
        });
      } catch (err) {
        console.error("Failed to refresh active tab data:", err);
      } finally {
        setLoadingMap(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    window.addEventListener("check-challenges", handleRefresh);
    window.addEventListener("refetch-all-tabs", handleRefresh);
    return () => {
      window.removeEventListener("check-challenges", handleRefresh);
      window.removeEventListener("refetch-all-tabs", handleRefresh);
    };
  }, [activeTab]);

  const handleTabChange = (slug: TabSlug) => {
    setActiveTab(slug);
    window.history.pushState(null, "", `/home?tab=${slug}`);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "home": return "Capture";
      case "dexe": return "DexE";
      case "challenges": return "Challenges";
      case "leaderboard": return "Leaderboard";
      case "profile": return "Profile";
      default: return "Capture";
    }
  };

  const getTabAction = () => {
    switch (activeTab) {
      case "home":
        return (
          <TabActionBadge>
            {data.home ? `${data.home.totalCards} caught` : "caught"}
          </TabActionBadge>
        );
      case "dexe":
        return (
          <TabActionBadge>
            {data.dexe ? `${data.dexe.length} caught` : "caught"}
          </TabActionBadge>
        );
      case "challenges":
        return <TabActionBadge>5 daily</TabActionBadge>;
      case "leaderboard":
        return <TabActionBadge>Global XP</TabActionBadge>;
      case "profile":
        return <TabActionBadge>Explorer</TabActionBadge>;
      default:
        return null;
    }
  };

  return (
    <BinderShell
      activeTab={activeTab}
      title={getTabTitle()}
      action={getTabAction()}
      onTabChange={handleTabChange}
    >
      <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as TabSlug)}>
        <TabsContents>
          <TabsContent value="home">
            {data.home ? <HomeScreen data={data.home} onTabChange={handleTabChange} /> : <TabSkeleton />}
          </TabsContent>
          <TabsContent value="dexe">
            {data.dexe ? <CollectionScreen items={data.dexe} /> : <TabSkeleton />}
          </TabsContent>
          <TabsContent value="challenges">
            {data.challenges ? <ChallengesScreen data={data.challenges} /> : <TabSkeleton />}
          </TabsContent>
          <TabsContent value="leaderboard">
            {data.leaderboard ? (
              <LeaderboardScreen
                weekly={data.leaderboard.weekly}
                monthly={data.leaderboard.monthly}
                allTime={data.leaderboard.allTime}
                currentUserId={userId}
              />
            ) : (
              <TabSkeleton />
            )}
          </TabsContent>
          <TabsContent value="profile">
            {data.profile ? <ProfileScreen data={data.profile} /> : <TabSkeleton />}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </BinderShell>
  );
}
