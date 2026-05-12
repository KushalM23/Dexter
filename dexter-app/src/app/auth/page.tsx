import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { getCurrentUser } from "@/lib/session";

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.onboardingComplete ? "/home" : "/onboarding");
  }

  return <AuthScreen />;
}
