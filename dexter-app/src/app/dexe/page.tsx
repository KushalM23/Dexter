import { BinderShell } from "@/components/layout/binder-shell";
import { TabActionBadge } from "@/components/ui/screen-primitives";
import { CollectionScreen } from "@/features/collection";
import { getCollectionData } from "@/lib/domain";
import { requireOnboardedUser } from "@/lib/session";

export default async function DexePage() {
  const user = await requireOnboardedUser();
  const items = await getCollectionData(user.id);

  return (
    <BinderShell
      activeTab="dexe"
      title="DexE"
      action={
        <TabActionBadge>{items.length} caught</TabActionBadge>
      }
    >
      <CollectionScreen items={items} />
    </BinderShell>
  );
}
