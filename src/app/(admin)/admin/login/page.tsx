import { redirect } from "next/navigation";
import { getAdminSession, LoginForm } from "@/features/admin";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const LINK_ERRORS: Record<string, string> = {
  auth: "Invite or login link is invalid or expired. Request a new invite, or sign in with email and password.",
  not_admin: "This account is not an admin. Set App Metadata role to admin in Supabase.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const admin = await getAdminSession();
  if (admin) redirect("/admin/reviews");

  const { error } = await searchParams;
  const linkError = error ? LINK_ERRORS[error] : undefined;

  return (
    <div className="flex flex-col gap-8 pt-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts are invited in Supabase; public signup is disabled.
        </p>
      </div>
      {linkError ? (
        <p role="alert" className="mx-auto max-w-sm text-center text-sm text-destructive">
          {linkError}
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
