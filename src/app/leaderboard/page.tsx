import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  redirect("/home?tab=leaderboard");
}
