import { BinderShell } from "@/components/binder-shell";
import { HomeScreen } from "@/components/home-screen";
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
        <div className="rounded-full bg-[#E7F4FF] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#2191FB]">
          {data.totalCards} caught
        </div>
      }
    >
      <HomeScreen data={data} />
    </BinderShell>
  );
}
