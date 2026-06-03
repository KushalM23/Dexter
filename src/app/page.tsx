import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

/**
 * Root page only decides where to redirect.
 *
 * It uses the shared session helper so transient auth/network failures
 * degrade into the existing auth redirect instead of crashing the request.
 */
export default async function IndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  redirect("/home");
}
