import { NextResponse } from "next/server";

import { ensureUserSetup } from "@/lib/domain";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const normalizedNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  // If Supabase redirected back with an error (e.g. "Database error saving new user"),
  // redirect to /auth so the user can retry instead of entering a redirect loop.
  if (errorParam) {
    console.error(
      `[auth/callback] OAuth error: ${errorParam} — ${errorDescription ?? "no description"}`,
    );
    return NextResponse.redirect(new URL("/auth", origin));
  }

  if (code) {
    const supabase = await createSupabaseRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      return NextResponse.redirect(new URL("/auth", origin));
    }

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      console.error(
        "[auth/callback] Could not resolve authenticated user after exchange:",
        userError?.message ?? "missing user",
      );
      return NextResponse.redirect(new URL("/auth", origin));
    }

    const user = await ensureUserSetup(authUser, { ensureChallenges: false });
    const fallbackPath = user.onboardingComplete ? "/home" : "/onboarding";
    const destination =
      normalizedNext && normalizedNext !== "/" ? normalizedNext : fallbackPath;

    return NextResponse.redirect(new URL(destination, origin));
  }

  return NextResponse.redirect(new URL(normalizedNext ?? "/auth", origin));
}
