import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/public";

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Supabase env missing. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  return key;
}

/**
 * Server client used in Server Components and Server Actions.
 *
 * Cookies are **read-only** here — session refresh is handled by the
 * middleware (`src/middleware.ts`) which runs before every request and
 * can write cookies.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Silently ignore — Server Components have read-only cookies.
          // The middleware handles session refresh before we get here.
        }
      },
    },
  });
}

/**
 * Server client used in Route Handlers (API routes).
 *
 * Route handlers CAN write cookies, so we always persist refreshed tokens.
 */
export async function createSupabaseRouteHandlerClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ignore when called from contexts where cookies are read-only.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicConfig();
  const serviceRoleKey = getServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

