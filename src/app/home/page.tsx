import { requireOnboardedUser } from "@/lib/session";
import { AppShellClient } from "@/components/layout/app-shell-client";
import type { TabSlug } from "@/lib/types";
import {
  getHomeData,
  getCollectionData,
  getChallengesData,
  getLeaderboardData,
  getProfileData,
} from "@/lib/domain";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireOnboardedUser();
  const resolvedParams = await searchParams;
  const initialTab = (resolvedParams.tab as TabSlug) || "home";

  // Pre-load ONLY the active landing tab's data on the server
  let initialData: any = null;
  if (initialTab === "home") {
    initialData = await getHomeData(user.id);
  } else if (initialTab === "dexe") {
    initialData = await getCollectionData(user.id);
  } else if (initialTab === "challenges") {
    initialData = await getChallengesData(user.id);
  } else if (initialTab === "leaderboard") {
    const [weekly, monthly, allTime] = await Promise.all([
      getLeaderboardData(user.id, "weekly"),
      getLeaderboardData(user.id, "monthly"),
      getLeaderboardData(user.id, "all-time"),
    ]);
    initialData = {
      weekly: weekly.rows,
      monthly: monthly.rows,
      allTime: allTime.rows,
    };
  } else if (initialTab === "profile") {
    initialData = await getProfileData(user.id);
  }

  const preloadedData = {
    home: initialTab === "home" ? initialData : null,
    dexe: initialTab === "dexe" ? initialData : null,
    challenges: initialTab === "challenges" ? initialData : null,
    leaderboard: initialTab === "leaderboard" ? initialData : null,
    profile: initialTab === "profile" ? initialData : null,
  };

  return (
    <AppShellClient
      userId={user.id}
      initialTab={initialTab}
      preloadedData={preloadedData}
    />
  );
}
