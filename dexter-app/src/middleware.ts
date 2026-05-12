import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that refreshes the Supabase auth session on every request.
 *
 * This is required because Server Components have read-only cookies and
 * cannot persist a refreshed token. The middleware runs before page
 * rendering and CAN write cookies, so it is the correct place to keep
 * the session alive and clear stale tokens.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh the session. This call reads the auth cookies, validates them,
  // and — if the access token is expired — uses the refresh token to get a
  // new pair. The refreshed tokens are written back via setAll above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on every route except static assets, _next internals, and favicon.
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
