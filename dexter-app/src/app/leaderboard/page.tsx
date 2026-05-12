import { BinderShell } from "@/components/binder-shell";
import { LeaderboardScreen } from "@/components/leaderboard-screen";
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
        <div className="rounded-full bg-[#FFF7BF] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#7A5C00]">
          Global XP
        </div>
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
