import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav, getAdminSession } from "@/features/admin";
import { fontVariables } from "@/lib/fonts";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

type Props = {
  children: ReactNode;
};

/** Separate root layout so `/admin` stays outside next-intl and storefront ISR. */
export default async function AdminRootLayout({ children }: Props) {
  const admin = await getAdminSession();

  return (
    <html lang="en" className={`${fontVariables} h-full dark antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <div className="min-h-full">
          {admin ? <AdminNav email={admin.email} /> : null}
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
