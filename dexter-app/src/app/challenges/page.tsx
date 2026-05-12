import { BinderShell } from "@/components/binder-shell";
import { ChallengesScreen } from "@/components/challenges-screen";
import { getChallengesData } from "@/lib/domain";
import { requireOnboardedUser } from "@/lib/session";

export default async function ChallengesPage() {
  const user = await requireOnboardedUser();
  const data = await getChallengesData(user.id);

  return (
    <BinderShell
      activeTab="challenges"
      title="Challenges"
      action={
        <div className="rounded-full bg-[#EAF9ED] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#1FC147]">
          3 daily
        </div>
      }
    >
      <ChallengesScreen data={data} />
    </BinderShell>
  );
}
