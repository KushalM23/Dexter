import { redirect } from "next/navigation";

import { OnboardingScreen } from "@/components/onboarding-screen";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.onboardingComplete) {
    redirect("/home");
  }

  return <OnboardingScreen initialName={user.googleName} friendCode={user.friendCode} />;
}
