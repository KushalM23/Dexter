import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { ChallengesScreen } from "@/features/challenges";
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
        <TabActionBadge>3 daily</TabActionBadge>
      }
    >
      <ChallengesScreen data={data} />
    </BinderShell>
  );
}
