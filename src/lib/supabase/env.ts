/** Shared env accessors for Supabase clients. Safe for browser (public keys only). */

export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set.");
  }
  return url;
}

export function getSupabasePublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.");
  }
  return key;
}

export function getSupabaseSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY must be set.");
  }
  return key;
}
