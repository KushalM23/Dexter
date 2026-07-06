import { redirect } from "next/navigation";

export default async function ChallengesPage() {
  redirect("/home?tab=challenges");
}
