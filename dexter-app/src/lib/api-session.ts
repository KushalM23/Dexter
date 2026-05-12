import { ensureUserSetup } from "@/lib/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getApiUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return ensureUserSetup(data.user);
  } catch {
    return null;
  }
}
