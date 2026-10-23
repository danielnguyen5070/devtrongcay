import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles invite / magic-link redirects from Supabase Auth.
 * Set Dashboard → Authentication → URL Configuration:
 *   Site URL = https://your-origin/admin/auth/callback
 *   Redirect URLs include the same path for local + production.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/admin/reviews";
  const safeNext = nextPath.startsWith("/admin") ? nextPath : "/admin/reviews";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (data.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/admin/login?error=not_admin", url.origin));
      }
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/admin/login?error=auth", url.origin));
}
