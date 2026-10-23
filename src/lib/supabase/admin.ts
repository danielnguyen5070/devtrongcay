import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env";

let client: SupabaseClient<Database> | undefined;

/**
 * Service-role client. Bypasses RLS — use only for validated server writes
 * (place_order, RAG indexer/search, privileged webhooks).
 */
export function createAdminClient() {
  if (client) return client;

  client = createClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}
