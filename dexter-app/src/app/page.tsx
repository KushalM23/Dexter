import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Root page — only decides where to redirect.
 *
 * Uses a lightweight auth + single-column DB check instead of the full
 * getCurrentUser() → ensureUserSetup() → ensureChallenges() chain,
 * which was adding ~1.2s of unnecessary work on every cold visit.
 */
export default async function IndexPage() {
  const supabase = await createSupabaseServerClient();

  // getUser() is cheap here because the middleware already refreshed the
  // session — the SDK reuses the validated token from cookies.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth");
  }

  // Single-column fetch — no joins, no challenge logic.
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_complete) {
    redirect("/onboarding");
  }

  redirect("/home");
}
