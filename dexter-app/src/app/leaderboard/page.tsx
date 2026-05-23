import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { LeaderboardScreen } from "@/features/leaderboard";
import { getLeaderboardData } from "@/lib/domain";
import { requireOnboardedUser } from "@/lib/session";

export default async function LeaderboardPage() {
  const user = await requireOnboardedUser();
  const weekly = await getLeaderboardData(user.id, "weekly");
  const monthly = await getLeaderboardData(user.id, "monthly");
  const allTime = await getLeaderboardData(user.id, "all-time");

  return (
    <BinderShell
      activeTab="leaderboard"
      title="Leaderboard"
      action={
        <TabActionBadge>Global XP</TabActionBadge>
      }
    >
      <LeaderboardScreen
        weekly={weekly.rows}
        monthly={monthly.rows}
        allTime={allTime.rows}
        currentUserId={user.id}
      />
    </BinderShell>
  );
}
