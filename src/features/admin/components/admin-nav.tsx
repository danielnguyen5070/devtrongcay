import Link from "next/link";
import { signOut } from "../api/auth-actions";

type Props = {
  email?: string;
};

export function AdminNav({ email }: Props) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/admin/reviews" className="text-sm font-semibold tracking-wide">
          Admin
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin/reviews" className="text-muted-foreground hover:text-foreground">
            Reviews
          </Link>
          <Link href="/admin/orders" className="text-muted-foreground hover:text-foreground">
            Orders
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {email ? <span className="text-muted-foreground">{email}</span> : null}
          <form action={signOut}>
            <button type="submit" className="text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
