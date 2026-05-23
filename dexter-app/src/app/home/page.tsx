import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { HomeScreen } from "@/features/home";
import { getHomeData } from "@/lib/domain";
import { requireOnboardedUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireOnboardedUser();
  const data = await getHomeData(user.id);

  return (
    <BinderShell
      activeTab="home"
      title="Capture"
      action={
        <TabActionBadge>{data.totalCards} caught</TabActionBadge>
      }
    >
      <HomeScreen data={data} />
    </BinderShell>
  );
}
