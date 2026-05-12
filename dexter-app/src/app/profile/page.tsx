import { BinderShell } from "@/components/binder-shell";
import { ProfileScreen } from "@/components/profile-screen";
import { getProfileData } from "@/lib/domain";
import { requireOnboardedUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireOnboardedUser();
  const data = await getProfileData(user.id);

  return (
    <BinderShell
      activeTab="profile"
      title="Profile"
      action={
        <div className="rounded-full bg-[#F3E8FF] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#7902BD]">
          Explorer
        </div>
      }
    >
      <ProfileScreen data={data} />
    </BinderShell>
  );
}
