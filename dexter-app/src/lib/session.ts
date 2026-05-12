import { redirect } from "next/navigation";

import { ensureUserSetup } from "@/lib/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return ensureUserSetup(data.user);
  } catch {
    // Gracefully handle auth errors (expired tokens, network issues, etc.)
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function requireOnboardedUser() {
  const user = await requireUser();

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  return user;
}
