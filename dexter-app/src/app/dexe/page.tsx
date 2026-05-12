import { BinderShell } from "@/components/binder-shell";
import { CollectionScreen } from "@/components/collection-screen";
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
        <div className="rounded-full bg-[#FFE6E3] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#FE5F55]">
          {items.length} caught
        </div>
      }
    >
      <CollectionScreen items={items} />
    </BinderShell>
  );
}
