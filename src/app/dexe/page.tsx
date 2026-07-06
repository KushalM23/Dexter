import { redirect } from "next/navigation";

export default async function DexePage() {
  redirect("/home?tab=dexe");
}
