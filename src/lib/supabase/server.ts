import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

let staticClient: SupabaseClient<Database> | undefined;

/**
 * Anonymous client that never reads cookies or headers. Use on ISR/static
 * public pages (plant catalog, sitemap, cart quote reads).
 */
export function createStaticClient() {
  if (staticClient) return staticClient;

  staticClient = createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return staticClient;
}

/**
 * Cookie-aware server client for Server Actions / Route Handlers. Do not call
 * from ISR data loaders — reading cookies opts the route into dynamic rendering.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only; ignore.
        }
      },
    },
  });
}
