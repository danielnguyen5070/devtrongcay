import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | undefined;
};

function isAdminRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object") return false;
  return (appMetadata as { role?: unknown }).role === "admin";
}

/** Returns the signed-in admin user, or null if missing / not an admin. */
export async function getAdminSession(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminRole(user.app_metadata)) return null;
  return { id: user.id, email: user.email };
}

/** Redirects to login unless the cookie session is an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
