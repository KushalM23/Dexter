import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { ProfileScreen } from "@/features/profile";
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
        <TabActionBadge>Explorer</TabActionBadge>
      }
    >
      <ProfileScreen data={data} />
    </BinderShell>
  );
}
